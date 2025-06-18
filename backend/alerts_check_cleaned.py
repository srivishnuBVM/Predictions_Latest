from fastapi import FastAPI, HTTPException, Query, BackgroundTasks, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, StreamingResponse
from fastapi.openapi.utils import get_openapi
from pydantic import BaseModel
import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestClassifier, IsolationForest
from sklearn.preprocessing import StandardScaler
from sklearn.impute import SimpleImputer
from sklearn.cluster import KMeans
from sklearn.manifold import TSNE
import joblib
from typing import List, Dict, Any, Optional
from datetime import datetime, timedelta
import os
from functools import lru_cache
import traceback
import asyncio
import logging
import io
import time
import threading
import concurrent.futures
from contextlib import asynccontextmanager
import pyarrow as pa
import pyarrow.parquet as pq
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger('attendance_api')

class DataStore:
    df = None
    last_loaded = None
    loading = False
    load_error = None
    indices = {}
    is_ready = False
    ml_models = {}
    anomaly_detector = None
    cluster_model = None
    feature_importance = None
    prediction_cache = {}
    anomaly_feature_columns = None
data_store = DataStore()

@asynccontextmanager
async def lifespan(app: FastAPI):
    background_thread = threading.Thread(target=load_and_process_data)
    background_thread.daemon = True
    background_thread.start()
    logger.info('Starting data loading in background...')
    yield
    logger.info('Shutting down application')
app = FastAPI(title='AI-Powered Attendance Analysis API', description='\n    This API provides AI-driven attendance analysis with predictive modeling and anomaly detection.\n    It includes endpoints for downloading various reports and analyzing student attendance patterns\n    using machine learning for early intervention recommendations.\n    ', version='2.0.0', docs_url='/docs', redoc_url='/redoc', lifespan=lifespan)

def custom_openapi():
    if app.openapi_schema:
        return app.openapi_schema
    openapi_schema = get_openapi(title='Attendance Analysis API', version='1.2.0', description='API for analyzing and reporting student attendance patterns with filtering', routes=app.routes)
    app.openapi_schema = openapi_schema
    return app.openapi_schema
app.openapi = custom_openapi
app.add_middleware(CORSMiddleware, allow_origins=['*'], allow_credentials=True, allow_methods=['*'], allow_headers=['*'], expose_headers=['Content-Disposition', 'Content-Type', 'Content-Length'], max_age=3600)

@app.middleware('http')
async def add_cors_headers(request: Request, call_next):
    response = await call_next(request)
    response.headers['Access-Control-Allow-Origin'] = '*'
    response.headers['Access-Control-Allow-Credentials'] = 'true'
    response.headers['Access-Control-Allow-Methods'] = 'GET, POST, PUT, DELETE, OPTIONS'
    response.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization'
    return response

class SummaryStatistics(BaseModel):
    total_students: int
    below_85_students: int
    below_85_percentage: float
    tier4_students: int
    tier4_percentage: float
    tier3_students: int
    tier3_percentage: float
    tier2_students: int
    tier2_percentage: float
    tier1_students: int
    tier1_percentage: float

class KeyInsight(BaseModel):
    insight: str

class Recommendation(BaseModel):
    recommendation: str

class AnalysisResponse(BaseModel):
    summary_statistics: SummaryStatistics
    key_insights: List[KeyInsight]
    recommendations: List[Recommendation]

class FilterOptions(BaseModel):
    districts: List[Dict[str, str]]
    schools: List[Dict[str, str]]
    grades: List[Dict[str, str]]

class AnalysisSearchCriteria(BaseModel):
    district_name: Optional[str] = None
    grade_level: Optional[str] = None
    school_name: Optional[str] = None

class DownloadReportCriteria(BaseModel):
    district_name: Optional[str] = None
    grade_level: Optional[str] = None
    school_name: Optional[str] = None
    report_type: str

class Below85ReportCriteria(BaseModel):
    district_name: Optional[str] = None
    grade_level: Optional[str] = None
    school_name: Optional[str] = None
    format: str = 'xlsx'

def load_and_process_data():
    """Load and process data in background with AI model training"""
    try:
        data_store.loading = True
        data_store.is_ready = False
        data_store.load_error = None
        logger.info('Starting data loading and AI model training...')
        start_time = time.time()
        df = load_data()
        if df is None or len(df) == 0:
            data_store.load_error = 'Failed to load data'
            data_store.loading = False
            return
        logger.info(f'Available columns in DataFrame: {df.columns.tolist()}')
        if 'SCHOOL_YEAR' in df.columns:
            df['SCHOOL_YEAR'] = pd.to_numeric(df['SCHOOL_YEAR'], errors='coerce')
            df_2024 = df[df['SCHOOL_YEAR'] == 2024].copy()
            if len(df_2024) > 0:
                df = df_2024
                logger.info(f'Filtered to 2024 data: {len(df)} records')
            else:
                logger.warning('No 2024 data found, using all available data')
        if 'STUDENT_ID' in df.columns:
            df = df.drop_duplicates(subset=['STUDENT_ID'])
            logger.info(f'Removed duplicates: {len(df)} unique students')
        else:
            raise ValueError('STUDENT_ID column not found in data')
        if 'Predictions' not in df.columns:
            raise ValueError('Predictions column not found in data')
        logger.info(f'Processing {len(df)} unique student records for AI models...')
        with concurrent.futures.ThreadPoolExecutor() as executor:
            predictions_future = executor.submit(lambda: df['Predictions'].values)
            predictions = predictions_future.result()
            df['RISK_SCORE'] = 100 - predictions
            df['RISK_LEVEL'] = pd.cut(df['RISK_SCORE'], bins=[0, 20, 40, 60, 80, 100], labels=['Very Low', 'Low', 'Medium', 'High', 'Critical'])
            df['Predicted_Attendance'] = predictions
            df['TIER'] = df['Predicted_Attendance'].apply(assign_tiers)
            train_ml_models_future = executor.submit(train_ml_models, df)
            train_anomaly_detector_future = executor.submit(train_anomaly_detector, df)
            train_clustering_future = executor.submit(train_clustering, df)
            data_store.ml_models = train_ml_models_future.result()
            data_store.anomaly_detector = train_anomaly_detector_future.result()
            data_store.cluster_model, data_store.cluster_insights = train_clustering_future.result()
        logger.info('Creating indices for faster filtering...')
        data_store.indices = {'DISTRICT_NAME': df['DISTRICT_NAME'].str.upper().to_dict(), 'STUDENT_GRADE_LEVEL': df['STUDENT_GRADE_LEVEL'].astype(str).to_dict()}
        if 'SCHOOL_NAME' in df.columns:
            data_store.indices['SCHOOL_NAME'] = df['SCHOOL_NAME'].str.upper().to_dict()
        logger.info('Applying AI predictions to the dataset...')
        apply_ai_predictions_to_dataset(df)
        data_store.df = df
        data_store.last_loaded = datetime.now()
        processing_time = time.time() - start_time
        logger.info(f'Data processing and AI model training completed in {processing_time:.2f} seconds')
        data_store.is_ready = True
    except Exception as e:
        logger.error(f'Error in data processing: {str(e)}')
        logger.error(traceback.format_exc())
        data_store.load_error = str(e)
    finally:
        data_store.loading = False
        return df

def train_ml_models(df):
    """Train machine learning models for predictive analytics using new column structure"""
    try:
        logger.info('Training machine learning models on attendance data...')
        models = {}
        feature_cols = []
        feature_cols.append('Predicted_Attendance')
        if 'Total_Days_Unexcused_Absent' in df.columns and 'Total_Days_Enrolled' in df.columns:
            df.loc[:, 'UNEXCUSED_ABSENT_RATE'] = df['Total_Days_Unexcused_Absent'] / df['Total_Days_Enrolled'] * 100
            feature_cols.append('UNEXCUSED_ABSENT_RATE')
        demo_cols = ['ECONOMIC_CODE', 'SPECIAL_ED_CODE', 'ENG_PROF_CODE', 'HISPANIC_IND']
        for col in demo_cols:
            if col in df.columns:
                feature_cols.append(col)
        logger.info(f'Using {len(feature_cols)} features for ML models: {feature_cols}')
        X = df[feature_cols].copy()
        X = X.fillna(X.mean())
        imputer = SimpleImputer(strategy='mean')
        X_imputed = imputer.fit_transform(X)
        scaler = StandardScaler()
        X_scaled = scaler.fit_transform(X_imputed)
        models['imputer'] = imputer
        models['scaler'] = scaler
        models['feature_columns'] = feature_cols
        if 'Predictions' in df.columns:
            threshold = 85
            y_risk = (df['Predictions'] < threshold).astype(int)
            logger.info(f'Using Predictions column with {threshold}% threshold as training target')
        else:
            y_risk = (df['Actual_Attendance'] < 85).astype(int)
            logger.info('Created risk target from current attendance < 85%')
        if len(X_scaled) > 50:
            rf_model = RandomForestClassifier(n_estimators=100, max_depth=10, random_state=42)
            rf_model.fit(X_scaled, y_risk)
            models['risk_predictor'] = rf_model
            feature_importance = dict(zip(feature_cols, rf_model.feature_importances_))
            models['feature_importance'] = feature_importance
            logger.info(f'ML models trained successfully. Feature importance: {feature_importance}')
        else:
            logger.warning(f'Not enough data to train ML models: {len(X_scaled)} rows. Need at least 50.')
        return models
    except Exception as e:
        logger.error(f'Error training ML models: {str(e)}')
        raise Exception(f'Failed to train ML models: {str(e)}')
        return {}

def train_anomaly_detector(df):
    """Train anomaly detection model with new column structure"""
    try:
        logger.info('Training anomaly detection model...')
        anomaly_features = []
        if 'Actual_Attendance' in df.columns:
            anomaly_features.append('Actual_Attendance')
        if 'Total_Days_Unexcused_Absent' in df.columns and 'Total_Days_Enrolled' in df.columns:
            df.loc[:, 'UNEXCUSED_ABSENT_RATE'] = df['Total_Days_Unexcused_Absent'] / df['Total_Days_Enrolled'] * 100
            anomaly_features.append('UNEXCUSED_ABSENT_RATE')
        demo_cols = ['ECONOMIC_CODE', 'SPECIAL_ED_CODE', 'ENG_PROF_CODE', 'HISPANIC_IND']
        for col in demo_cols:
            if col in df.columns:
                anomaly_features.append(col)
        logger.info(f'Using {len(anomaly_features)} features for anomaly detection: {anomaly_features}')
        X = df[anomaly_features].copy()
        X = X.fillna(X.mean())
        scaler = StandardScaler()
        X_scaled = scaler.fit_transform(X)
        iforest = IsolationForest(n_estimators=100, contamination=0.1, random_state=42)
        iforest.fit(X_scaled)
        data_store.anomaly_feature_columns = anomaly_features
        data_store.anomaly_scaler = scaler
        logger.info('Anomaly detection model trained successfully')
        return iforest
    except Exception as e:
        logger.error(f'Error training anomaly detector: {str(e)}')
        logger.error(traceback.format_exc())
        return None

def train_clustering(df):
    """Train clustering model for pattern recognition"""
    try:
        logger.info('Training clustering model for pattern recognition...')
        cluster_features = []
        if 'Actual_Attendance' in df.columns:
            cluster_features.append('Actual_Attendance')
        if 'UNEXCUSED_ABSENT_RATE' in df.columns:
            cluster_features.append('UNEXCUSED_ABSENT_RATE')
        demographic_features = ['ECONOMIC_CODE', 'SPECIAL_ED_CODE', 'ENG_PROF_CODE', 'HISPANIC_IND']
        for feature in demographic_features:
            if feature in df.columns:
                cluster_features.append(feature)
        logger.info(f'Using {len(cluster_features)} features for clustering: {cluster_features}')
        if not cluster_features:
            logger.error('No valid features found for clustering')
            return (None, {})
        X = df[cluster_features].copy()
        X = X.fillna(X.mean())
        imputer = SimpleImputer(strategy='mean')
        X_imputed = imputer.fit_transform(X)
        scaler = StandardScaler()
        X_scaled = scaler.fit_transform(X_imputed)
        kmeans = KMeans(n_clusters=3, random_state=42)
        clusters = kmeans.fit_predict(X_scaled)
        df['CLUSTER'] = clusters
        centroids = scaler.inverse_transform(kmeans.cluster_centers_)
        cluster_insights = {'cluster_centers': centroids, 'cluster_sizes': pd.Series(clusters).value_counts().to_dict(), 'feature_importance': {}}
        for feature_idx, feature in enumerate(cluster_features):
            feature_importance = {}
            for cluster_idx in range(3):
                cluster_data = X[clusters == cluster_idx]
                mean_value = cluster_data.iloc[:, feature_idx].mean()
                feature_importance[cluster_idx] = mean_value
            cluster_insights['feature_importance'][feature] = feature_importance
        logger.info('Clustering model trained successfully')
        return (kmeans, cluster_insights)
    except Exception as e:
        logger.error(f'Error in clustering: {str(e)}')
        logger.error(traceback.format_exc())
        return (None, {})

def apply_ai_predictions_to_dataset(df):
    """Apply AI predictions to the dataset for risk forecasting and anomaly detection"""
    try:
        if 'risk_predictor' not in data_store.ml_models:
            logger.warning('Risk predictor model not available')
            return
        feature_cols = data_store.ml_models.get('feature_columns', [])
        if not feature_cols:
            logger.warning('No feature columns defined for prediction')
            return
        missing_cols = [col for col in feature_cols if col not in df.columns]
        if missing_cols:
            logger.warning(f'Missing columns in dataset: {missing_cols}')
            for col in missing_cols:
                df[col] = np.nan
        X = df[feature_cols].copy()
        X = X.fillna(X.mean())
        X_imputed = data_store.ml_models['imputer'].transform(X)
        X_scaled = data_store.ml_models['scaler'].transform(X_imputed)
        if data_store.anomaly_detector is not None:
            anomaly_features = data_store.anomaly_feature_columns
            missing_anomaly_cols = [col for col in anomaly_features if col not in df.columns]
            if missing_anomaly_cols:
                for col in missing_anomaly_cols:
                    df[col] = np.nan
            X_anomaly = df[anomaly_features].copy()
            X_anomaly = X_anomaly.fillna(X_anomaly.mean())
            X_scaled_anomaly = data_store.anomaly_scaler.transform(X_anomaly)
            anomaly_scores = data_store.anomaly_detector.decision_function(X_scaled_anomaly)
            anomalies = data_store.anomaly_detector.predict(X_scaled_anomaly)
            df['IS_ANOMALY'] = (anomalies == -1).astype(int)
            df['ANOMALY_SCORE'] = (-anomaly_scores).astype(float)
        if data_store.ml_models and 'risk_predictor' in data_store.ml_models:
            feature_cols = data_store.ml_models['feature_columns']
            X = df[feature_cols].copy()
            X = X.fillna(X.mean())
            X_imputed = data_store.ml_models['imputer'].transform(X)
            X_scaled = data_store.ml_models['scaler'].transform(X_imputed)
            risk_predictions = data_store.ml_models['risk_predictor'].predict(X_scaled)
            try:
                risk_probas = data_store.ml_models['risk_predictor'].predict_proba(X_scaled)
                df['PREDICTED_RISK_PROBABILITY'] = risk_probas[:, 1]
            except:
                df['PREDICTED_RISK_PROBABILITY'] = risk_predictions
            df['AI_RISK_SCORE'] = 0.5 * df['RISK_SCORE'] + 0.3 * (100 * df['PREDICTED_RISK_PROBABILITY'])
            if 'ANOMALY_SCORE' in df.columns:
                max_anomaly = df['ANOMALY_SCORE'].max()
                min_anomaly = df['ANOMALY_SCORE'].min()
                if max_anomaly > min_anomaly:
                    normalized_anomaly = 100 * (df['ANOMALY_SCORE'] - min_anomaly) / (max_anomaly - min_anomaly)
                    df['AI_RISK_SCORE'] += 0.2 * normalized_anomaly
            df['AI_RISK_LEVEL'] = pd.cut(df['AI_RISK_SCORE'], bins=[0, 20, 40, 60, 80, 100], labels=['Very Low', 'Low', 'Medium', 'High', 'Critical'])
        logger.info('AI predictions applied to dataset successfully')
    except Exception as e:
        logger.error(f'Error applying AI predictions: {str(e)}')
        logger.error(traceback.format_exc())

def load_data():
    """Load data from Parquet file, falling back to Excel if needed"""
    try:
        base_dir = os.path.dirname(os.path.abspath(__file__))
        parquet_file = os.path.join(base_dir, 'Data/students.parquet')
        excel_file = os.path.join(base_dir, 'Predictions.xlsx')
        logger.info('Attempting to load data...')
        if os.path.exists(parquet_file):
            logger.info(f'Loading data from Parquet file: {parquet_file}')
            start_time = time.time()
            try:
                df = pd.read_parquet(parquet_file)
                parquet_load_time = time.time() - start_time
                logger.info(f'Successfully loaded {len(df)} rows from Parquet file in {parquet_load_time:.2f} seconds')
                logger.info(f'Available columns: {df.columns.tolist()}')
                logger.info(f"First few values of SCHOOL_YEAR: {df['SCHOOL_YEAR'].head().tolist()}")
                logger.info(f"Unique values in SCHOOL_YEAR: {df['SCHOOL_YEAR'].unique()}")
                return df
            except Exception as e:
                logger.error(f'Error loading Parquet file: {str(e)}')
                logger.error(traceback.format_exc())
        if os.path.exists(excel_file):
            logger.info(f'Loading data from Excel file: {excel_file}')
            start_time = time.time()
            try:
                df = pd.read_excel(excel_file, engine='openpyxl', dtype={'STUDENT_ID': str, 'DISTRICT_NAME': str, 'SCHOOL_NAME': str, 'STUDENT_GRADE_LEVEL': str, 'Total_Days_Present': float, 'Total_Days_Enrolled': float, 'SCHOOL_YEAR': str})
                excel_load_time = time.time() - start_time
                logger.info(f'Successfully loaded {len(df)} rows from Excel file in {excel_load_time:.2f} seconds')
                logger.info(f'Available columns: {df.columns.tolist()}')
                logger.info(f"First few values of SCHOOL_YEAR: {df['SCHOOL_YEAR'].head().tolist()}")
                logger.info(f"Unique values in SCHOOL_YEAR: {df['SCHOOL_YEAR'].unique()}")
                if 'DISTRICT_NAME' in df.columns:
                    logger.info(f"Unique districts: {df['DISTRICT_NAME'].unique()}")
                if 'SCHOOL_NAME' in df.columns:
                    logger.info(f"Unique schools: {df['SCHOOL_NAME'].unique()}")
                if 'GRADE_LEVEL' in df.columns:
                    logger.info(f"Unique grades: {df['GRADE_LEVEL'].unique()}")
                logger.info(f'Sample data:\n{df.head().to_string()}')
                logger.info(f'Converting Excel data to Parquet format for faster future loading')
                df.to_parquet(parquet_file, index=False, compression='snappy')
                save_time = time.time() - (start_time + excel_load_time)
                logger.info(f'Saved Parquet file in {save_time:.2f} seconds. Future loads will be much faster.')
                return df
            except Exception as e:
                logger.error(f'Error loading Excel file: {str(e)}')
                logger.error(traceback.format_exc())
        logger.error(f'No valid data file found at {base_dir}')
        return None
    except Exception as e:
        logger.error(f'Error loading data file: {str(e)}')
        logger.error(traceback.format_exc())
        return None

def filter_data(df, district_name=None, grade_level=None, school_name=None, student_id=None):
    """Filter data based on provided parameters using optimized approach"""
    try:
        start_time = time.time()
        mask = pd.Series(True, index=df.index)
        logger.info(f'Starting with {len(df)} rows')
        if district_name and district_name.strip():
            district_name_clean = district_name.strip().upper()
            mask &= df['DISTRICT_NAME'].str.strip().str.upper() == district_name_clean
            logger.info(f'After district filter ({district_name_clean}): {mask.sum()} rows remaining')
        if grade_level is not None and str(grade_level).strip():
            grade_level_str = str(grade_level).strip()
            if 'STUDENT_GRADE_LEVEL' in df.columns:
                mask &= df['STUDENT_GRADE_LEVEL'].astype(str).str.strip() == grade_level_str
            elif 'GRADE_LEVEL' in df.columns:
                mask &= df['GRADE_LEVEL'].astype(str).str.strip() == grade_level_str
            else:
                logger.warning(f'Neither STUDENT_GRADE_LEVEL nor GRADE_LEVEL column found in dataset')
            logger.info(f'After grade filter ({grade_level_str}): {mask.sum()} rows remaining')
        else:
            pass
        if school_name and school_name.strip() and ('SCHOOL_NAME' in df.columns):
            school_name_clean = school_name.strip().upper()
            mask &= df['SCHOOL_NAME'].str.strip().str.upper() == school_name_clean
            logger.info(f'After school filter ({school_name_clean}): {mask.sum()} rows remaining')
        if student_id and str(student_id).strip():
            mask &= df['STUDENT_ID'].astype(str) == str(student_id)
            logger.info(f'After student filter: {mask.sum()} rows remaining')
        if 'SCHOOL_YEAR' in df.columns:
            mask &= (df['SCHOOL_YEAR'] == '2024') | (df['SCHOOL_YEAR'] == 2024)
            logger.info(f'After school year filter: {mask.sum()} rows remaining')
        filtered_df = df[mask]
        logger.info(f'Filtering completed in {time.time() - start_time:.4f} seconds, returning {len(filtered_df)} rows')
        if len(filtered_df) > 0:
            logger.info(f'Sample filtered data:\n{filtered_df.head().to_string()}')
            logger.info(f"Unique schools: {filtered_df['SCHOOL_NAME'].unique()}")
            if 'STUDENT_GRADE_LEVEL' in filtered_df.columns:
                logger.info(f"Unique grades: {filtered_df['STUDENT_GRADE_LEVEL'].unique()}")
            elif 'GRADE_LEVEL' in filtered_df.columns:
                logger.info(f"Unique grades: {filtered_df['GRADE_LEVEL'].unique()}")
            else:
                logger.warning('Neither STUDENT_GRADE_LEVEL nor GRADE_LEVEL column found')
        return filtered_df
    except Exception as e:
        logger.error(f'Error in filter_data: {str(e)}')
        logger.error(traceback.format_exc())
        raise

def calculate_risk_score(attendance_percentage: float, risk_factors: List[str]) -> float:
    """Calculate risk score based on attendance percentage and risk factors"""
    base_score = 100 - attendance_percentage
    risk_factor_points = len(risk_factors) * 5
    return min(100, base_score + risk_factor_points)

def get_risk_level(risk_score: float) -> str:
    """Convert risk score to risk level"""
    if risk_score >= 80:
        return 'Critical'
    elif risk_score >= 60:
        return 'High'
    elif risk_score >= 40:
        return 'Medium'
    elif risk_score >= 20:
        return 'Low'
    else:
        return 'Safe'

def get_tier(attendance_percentage: float) -> str:
    """Get tier based on attendance percentage
    Tier 1: ≥95% predicted attendance – no intervention needed.
    Tier 2: 90% to <95% predicted attendance – needs individualized prevention.
    Tier 3: 80% to <90% predicted attendance – early intervention required.
    Tier 4: <80% predicted attendance – needs intensive intervention.
    """
    if attendance_percentage >= 95:
        return 'Tier 1'
    elif attendance_percentage >= 90:
        return 'Tier 2'
    elif attendance_percentage >= 80:
        return 'Tier 3'
    else:
        return 'Tier 4'

def assign_tiers(attendance_percentage: float) -> str:
    """Assign tier based on attendance percentage"""
    return get_tier(attendance_percentage)

@app.post('/api/prediction-insights/', response_model=AnalysisResponse)
async def get_analysis(search_criteria: AnalysisSearchCriteria):
    """Unified analysis API: full dataset if no filters, else apply filters."""
    if not data_store.is_ready:
        raise HTTPException(status_code=503, detail='Data is still being loaded. Please try again shortly.')
    try:
        start_time = time.time()
        df = data_store.df
        total_students = len(df)
        if any([search_criteria.district_name, search_criteria.grade_level, search_criteria.school_name]):
            df = filter_data(df, search_criteria.district_name, search_criteria.grade_level, search_criteria.school_name)
        if len(df) == 0:
            raise HTTPException(status_code=404, detail=f'No data found for filters: district={search_criteria.district_name}, grade={search_criteria.grade_level}, school={search_criteria.school_name}')
        total_students = len(df)
        if 'Predictions' in df.columns:
            predictions = df['Predictions'] * 100
            attendance_series = predictions
        elif 'Predicted_Attendance' in df.columns:
            attendance_series = df['Predicted_Attendance']
        else:
            raise HTTPException(status_code=500, detail='No attendance data available in the dataset')
        df['TIER'] = attendance_series.apply(assign_tiers)
        tier_series = df['TIER']
        df['RISK_LEVEL'] = attendance_series.apply(assign_risk_level)
        risk_level_series = df['RISK_LEVEL']
        below_85_mask = attendance_series < 85
        critical_risk_mask = risk_level_series == 'Critical'
        tier_counts = tier_series.value_counts()
        tier4 = int(tier_counts.get('Tier 4', 0))
        tier3 = int(tier_counts.get('Tier 3', 0))
        tier2 = int(tier_counts.get('Tier 2', 0))
        tier1 = int(tier_counts.get('Tier 1', 0))
        below_85_students = int(below_85_mask.sum())
        critical_risk_students = int(critical_risk_mask.sum())
        summary = SummaryStatistics(total_students=total_students, below_85_students=below_85_students, below_85_percentage=below_85_students / total_students * 100 if total_students else 0.0, tier4_students=tier4, tier4_percentage=tier4 / total_students * 100 if total_students else 0.0, tier3_students=tier3, tier3_percentage=tier3 / total_students * 100 if total_students else 0.0, tier2_students=tier2, tier2_percentage=tier2 / total_students * 100 if total_students else 0.0, tier1_students=tier1, tier1_percentage=tier1 / total_students * 100 if total_students else 0.0)
        insights = generate_ai_insights(df)
        recommendations = generate_ai_recommendations(df)
        logger.info(f'AI analysis completed in {time.time() - start_time:.4f} seconds')
        return AnalysisResponse(summary_statistics=summary, key_insights=insights, recommendations=recommendations)
    except Exception as e:
        logger.error(f'Error in get_analysis: {str(e)}')
        raise HTTPException(status_code=500, detail=str(e))

def assign_risk_level(attendance):
    """Assign risk level based on attendance percentage"""
    if attendance >= 95:
        return 'Low'
    elif attendance >= 90:
        return 'Medium'
    elif attendance >= 80:
        return 'High'
    else:
        return 'Critical'

def generate_ai_insights(df):
    """Generate AI-driven insights based on the data and ML model results"""
    insights = []
    if 'Predicted_Attendance' not in df.columns:
        df['Predicted_Attendance'] = df['Total_Days_Present'] / df['Total_Days_Enrolled'] * 100
    tier4_pct = (df['TIER'] == 'Tier 4').sum() / len(df) * 100 if len(df) > 0 else 0
    tier3_pct = (df['TIER'] == 'Tier 3').sum() / len(df) * 100 if len(df) > 0 else 0
    tier2_pct = (df['TIER'] == 'Tier 2').sum() / len(df) * 100 if len(df) > 0 else 0
    tier1_pct = (df['TIER'] == 'Tier 1').sum() / len(df) * 100 if len(df) > 0 else 0
    tier_insights = [KeyInsight(insight=f"Tier 4 Students: {(df['TIER'] == 'Tier 4').sum()} students ({tier4_pct:.1f}%) have attendance below 80% - needs intensive intervention"), KeyInsight(insight=f"Tier 3 Students: {(df['TIER'] == 'Tier 3').sum()} students ({tier3_pct:.1f}%) have attendance between 80-90% - early intervention required"), KeyInsight(insight=f"Tier 2 Students: {(df['TIER'] == 'Tier 2').sum()} students ({tier2_pct:.1f}%) have attendance between 90-95% - needs individualized prevention"), KeyInsight(insight=f"Tier 1 Students: {(df['TIER'] == 'Tier 1').sum()} students ({tier1_pct:.1f}%) have attendance above 95% - no intervention needed")]
    if 'Predictions' in df.columns:
        predicted_decliners = df[df['Predictions'] == 1]
        if len(predicted_decliners) > 0:
            insights.append(KeyInsight(insight=f'AI MODEL PREDICTION: {len(predicted_decliners)} students ({len(predicted_decliners) / len(df) * 100:.1f}%) are predicted to have problematic attendance in the future'))
            early_warning = df[(df['Predicted_Attendance'] >= 85) & (df['Predictions'] == 1)]
            if len(early_warning) > 0:
                insights.append(KeyInsight(insight=f'AI EARLY WARNING: {len(early_warning)} students ({len(early_warning) / len(df) * 100:.1f}%) currently have good attendance but are predicted to decline'))
    if 'Total_Days_Unexcused_Absent' in df.columns and 'Total_Days_Enrolled' in df.columns:
        df.loc[:, 'UNEXCUSED_ABSENT_RATE'] = df['Total_Days_Unexcused_Absent'] / df['Total_Days_Enrolled'] * 100
        high_unexcused = df[df['UNEXCUSED_ABSENT_RATE'] > 10]
        if len(high_unexcused) > 0:
            insights.append(KeyInsight(insight=f'HIGH UNEXCUSED ABSENCES: {len(high_unexcused)} students ({len(high_unexcused) / len(df) * 100:.1f}%) have unexcused absence rates above 10%'))
    chronic_threshold = 80
    chronic_students = df[df['Predicted_Attendance'] < chronic_threshold]
    if len(chronic_students) > 0:
        insights.append(KeyInsight(insight=f'CHRONIC ABSENCE ALERT: {len(chronic_students)} students ({len(chronic_students) / len(df) * 100:.1f}%) are chronically absent with attendance below {chronic_threshold}%'))
    if 'STUDENT_GRADE_LEVEL' in df.columns:
        grade_analysis = df.groupby('STUDENT_GRADE_LEVEL')['Predicted_Attendance'].mean()
        lowest_grade = grade_analysis.idxmin()
        lowest_attendance = grade_analysis.min()
        insights.append(KeyInsight(insight=f'GRADE LEVEL ANALYSIS: Grade {lowest_grade} has the lowest average attendance at {lowest_attendance:.1f}%'))
    return tier_insights + insights

def generate_ai_recommendations(df):
    """Generate AI-driven recommendations based on the data and ML model results"""
    recommendations = []
    if 'Predicted_Attendance' not in df.columns:
        df['Predicted_Attendance'] = df['Total_Days_Present'] / df['Total_Days_Enrolled'] * 100
    if 'RISK_LEVEL' in df.columns:
        risk_counts = df['RISK_LEVEL'].value_counts()
        critical = int(risk_counts.get('Critical', 0))
        high = int(risk_counts.get('High', 0))
        medium = int(risk_counts.get('Medium', 0))
        low = int(risk_counts.get('Low', 0))
        basic_recommendations = [Recommendation(recommendation=f'Focus immediate interventions on {critical} students at Critical risk level'), Recommendation(recommendation=f'Implement targeted support for {high} students at High risk level'), Recommendation(recommendation=f'Monitor {medium} students at Medium risk level'), Recommendation(recommendation=f'Develop preventive measures for {low} students at Low risk level')]
        recommendations.extend(basic_recommendations)
    if 'Predictions' in df.columns:
        early_warning = df[(df['Predicted_Attendance'] >= 85) & (df['Predictions'] == 1)]
        if len(early_warning) > 0:
            recommendations.append(Recommendation(recommendation=f'AI EARLY WARNING: Initiate preventive measures for {len(early_warning)} students who currently have good attendance but show high probability of future decline'))
    if 'Total_Days_Unexcused_Absent' in df.columns and 'Total_Days_Enrolled' in df.columns:
        df.loc[:, 'UNEXCUSED_ABSENT_RATE'] = df['Total_Days_Unexcused_Absent'] / df['Total_Days_Enrolled'] * 100
        high_unexcused = df[df['UNEXCUSED_ABSENT_RATE'] > 15]
        if len(high_unexcused) > 0:
            recommendations.append(Recommendation(recommendation=f'UNEXCUSED ABSENCE FOCUS: Implement attendance policies and family engagement for {len(high_unexcused)} students with high unexcused absence rates'))
    chronic_students = df[df['Predicted_Attendance'] < 70]
    if len(chronic_students) > 0:
        recommendations.append(Recommendation(recommendation=f'CHRONIC ABSENCE INTERVENTION: Develop intensive support plans for {len(chronic_students)} students with severe chronic absenteeism (below 70%)'))
    if 'STUDENT_GRADE_LEVEL' in df.columns:
        grade_analysis = df.groupby('STUDENT_GRADE_LEVEL')['Predicted_Attendance'].mean()
        problematic_grades = grade_analysis[grade_analysis < 85].index.tolist()
        if problematic_grades:
            recommendations.append(Recommendation(recommendation=f"GRADE-LEVEL FOCUS: Implement grade-specific interventions for grades {', '.join(map(str, problematic_grades))} showing below-target attendance"))
    return recommendations

def get_primary_risk_factor(student_row):
    """Determine the primary risk factor for a specific student based on their data"""
    if not data_store.ml_models or 'feature_importance' not in data_store.ml_models:
        return 'Unknown'
    top_feature = max(data_store.ml_models['feature_importance'].items(), key=lambda x: x[1])[0]
    factor_mapping = {'Predicted_Attendance': 'Current Attendance Level', 'Total_Days_Unexcused_Absent': 'Unexcused Absent Days', 'Total_Days_Present': 'Days Present', 'Total_Days_Enrolled': 'Days Enrolled', 'STUDENT_GRADE_LEVEL': 'Grade Level'}
    return factor_mapping.get(top_feature, 'Multiple factors')

@app.get('/api/filter-options', response_model=FilterOptions)
async def get_filter_options():
    """Get hierarchical filter options for districts, schools, and grades"""
    if not data_store.is_ready:
        raise HTTPException(status_code=503, detail='Data is still being loaded. Please try again shortly.')
    try:
        df = data_store.df
        district_map = {}
        for district_name, district_df in df.groupby('DISTRICT_NAME'):
            schools_in_district = []
            for school_name, school_df in district_df.groupby('SCHOOL_NAME'):
                grades_in_school = school_df['STUDENT_GRADE_LEVEL'].unique().tolist()
                grades_in_school = [str(g) for g in grades_in_school]
                grades_in_school = [{'value': g, 'label': g} for g in sorted(grades_in_school)]
                schools_in_district.append({'value': str(school_name), 'label': str(school_name), 'district': str(district_name), 'grades': grades_in_school})
            district_map[str(district_name)] = {'value': str(district_name), 'label': str(district_name), 'schools': sorted(schools_in_district, key=lambda x: x['label'])}
        districts = [district_map[d] for d in sorted(district_map.keys())]
        flat_districts = [{'value': d, 'label': d} for d in sorted(district_map.keys())]
        flat_schools = []
        for district in districts:
            for school in district['schools']:
                flat_schools.append({'value': school['value'], 'label': school['label'], 'district': school['district']})
        flat_schools = sorted(flat_schools, key=lambda x: x['label'])
        all_grades = set()
        for district in districts:
            for school in district['schools']:
                for grade in school['grades']:
                    all_grades.add(grade['value'])
        flat_grades = [{'value': g, 'label': g} for g in sorted(all_grades)]
        return FilterOptions(districts=flat_districts, schools=flat_schools, grades=flat_grades)
    except Exception as e:
        logger.error(f'Error retrieving filter options: {str(e)}')
        logger.error(traceback.format_exc())
        raise HTTPException(status_code=500, detail=f'Error retrieving filter options: {str(e)}')

@app.post('/api/download/report/{report_type}', response_model=None)
async def download_report(criteria: DownloadReportCriteria, report_type: str):
    """Download various types of reports with filtering using predictions"""
    if not data_store.is_ready:
        raise HTTPException(status_code=503, detail='Data not loaded yet')
    try:
        df = data_store.df.copy()
        if any([criteria.district_name, criteria.grade_level, criteria.school_name]):
            df = filter_data(df, district_name=criteria.district_name, grade_level=criteria.grade_level, school_name=criteria.school_name)
        if len(df) == 0:
            raise HTTPException(status_code=404, detail='No data found for the selected filters')
        if 'Predictions' in df.columns:
            df['Predicted_Attendance'] = df['Predictions'] * 100
        elif 'Predicted_Attendance' in df.columns:
            df['Predicted_Attendance'] = df['Predicted_Attendance']
        else:
            raise HTTPException(status_code=500, detail='No attendance data available in the dataset')
        df['TIER'] = df['Predicted_Attendance'].apply(assign_tiers)
        if report_type.lower() == 'below_85':
            below_85_df = df[df['Predicted_Attendance'] < 85].copy()
            if len(below_85_df) == 0:
                raise HTTPException(status_code=404, detail='No students found with attendance below 85%')
            below_85_df = below_85_df.sort_values('Predicted_Attendance')
            below_85_report = generate_detailed_report(below_85_df)
            output = io.BytesIO()
            below_85_report.to_excel(output, index=False)
            output.seek(0)
            content_type = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
            filename = f"attendance_below_85_{datetime.now().strftime('%Y%m%d_%H%M%S')}.xlsx"
        elif report_type.lower() == 'summary':
            summary_df = generate_summary_report(df)
            output = io.BytesIO()
            summary_df.to_excel(output, index=False)
            output.seek(0)
            content_type = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
            filename = f"attendance_summary_{datetime.now().strftime('%Y%m%d_%H%M%S')}.xlsx"
        elif report_type.lower() == 'detailed':
            detailed_df = generate_detailed_report(df)
            output = io.BytesIO()
            detailed_df.to_excel(output, index=False)
            output.seek(0)
            content_type = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
            filename = f"attendance_detailed_{datetime.now().strftime('%Y%m%d_%H%M%S')}.xlsx"
        else:
            raise HTTPException(status_code=400, detail=f'Invalid report type: {report_type}')
        headers = {'Content-Disposition': f'attachment; filename={filename}'}
        return StreamingResponse(output, media_type=content_type, headers=headers)
    except Exception as e:
        logger.error(f'Error generating report: {str(e)}')
        logger.error(traceback.format_exc())
        raise HTTPException(status_code=500, detail=f'Error generating report: {str(e)}')
        headers = {'Content-Disposition': f'attachment; filename={filename}'}
        if report_type.lower() == 'csv':
            return StreamingResponse(output_bytes, media_type=content_type, headers=headers)
        else:
            return StreamingResponse(output, media_type=content_type, headers=headers)
    except Exception as e:
        logger.error(f'Error generating report: {str(e)}')
        logger.error(traceback.format_exc())
        raise HTTPException(status_code=500, detail=f'Error generating report: {str(e)}')

def generate_summary_report(df):
    """Generate a summary report with aggregated data"""
    group_cols = ['DISTRICT_NAME', 'STUDENT_GRADE_LEVEL']
    if 'SCHOOL_NAME' in df.columns:
        group_cols.insert(1, 'SCHOOL_NAME')
    if 'Predicted_Attendance' not in df.columns:
        df['Predicted_Attendance'] = df['Total_Days_Present'] / df['Total_Days_Enrolled'] * 100
    if 'RISK_SCORE' not in df.columns:
        df['RISK_SCORE'] = 100 - df['Predicted_Attendance']
    summary = df.groupby(group_cols).agg({'STUDENT_ID': 'count', 'Predicted_Attendance': ['mean', 'min', 'max', 'std'], 'RISK_SCORE': ['mean', 'min', 'max']}).reset_index()
    summary.columns = [' '.join(col).strip() for col in summary.columns.values]
    tiers = ['Tier 4', 'Tier 3', 'Tier 2', 'Tier 1']
    for tier in tiers:
        tier_counts = df.groupby(group_cols)['TIER'].apply(lambda x: (x == tier).sum()).reset_index(name=f'{tier} Count')
        summary = pd.merge(summary, tier_counts, on=group_cols)
    for tier in tiers:
        summary[f'{tier} %'] = (summary[f'{tier} Count'] / summary['STUDENT_ID count'] * 100).round(2)
    summary.rename(columns={'STUDENT_ID count': 'Total Students', 'Predicted_Attendance mean': 'Avg Attendance %', 'Predicted_Attendance min': 'Min Attendance %', 'Predicted_Attendance max': 'Max Attendance %', 'Predicted_Attendance std': 'Std Dev Attendance', 'RISK_SCORE mean': 'Avg Risk Score', 'RISK_SCORE min': 'Min Risk Score', 'RISK_SCORE max': 'Max Risk Score'}, inplace=True)
    return summary

def generate_detailed_report(df):
    """Generate a detailed student-level report with risk factors and recommendations"""
    report_df = df.copy()
    if 'Predicted_Attendance' not in df.columns:
        report_df['Predicted_Attendance'] = report_df['Total_Days_Present'] / report_df['Total_Days_Enrolled'] * 100
    if 'RISK_SCORE' not in report_df.columns:
        report_df['RISK_SCORE'] = 100 - report_df['Predicted_Attendance']
    if 'RISK_LEVEL' not in report_df.columns:
        report_df['RISK_LEVEL'] = report_df['Predicted_Attendance'].apply(assign_risk_level)
    risk_factors = []
    recommendations = []
    insights = []
    for _, row in report_df.iterrows():
        student_risk_factors = []
        student_recommendations = []
        attendance = row['Predicted_Attendance']
        avg_prediction = df['Predictions'].mean()
        if avg_prediction < 90:
            insights.append('Predicted attendance is below 90% ({:.1f}%) - immediate action needed'.format(avg_prediction))
        if attendance < 70:
            student_risk_factors.append('Severe chronic absenteeism')
            student_recommendations.append('Immediate intervention required')
            student_recommendations.append('Family engagement specialist referral')
        elif attendance < 80:
            student_risk_factors.append('Chronic absenteeism')
            student_recommendations.append('Attendance improvement plan')
        elif attendance < 85:
            student_risk_factors.append('At risk of chronic absenteeism')
            student_recommendations.append('Early warning monitoring')
        risk_factors.append('|'.join(student_risk_factors) if student_risk_factors else 'None')
        recommendations.append('|'.join(student_recommendations) if student_recommendations else 'Continue monitoring')
    report_df['Risk Factors'] = risk_factors
    report_df['Recommendations'] = recommendations
    columns_to_include = ['STUDENT_ID', 'DISTRICT_NAME', 'STUDENT_GRADE_LEVEL', 'Predicted_Attendance', 'TIER', 'RISK_SCORE', 'RISK_LEVEL', 'Risk Factors', 'Recommendations']
    if 'SCHOOL_NAME' in report_df.columns:
        columns_to_include.insert(2, 'SCHOOL_NAME')
    existing_columns = [col for col in columns_to_include if col in report_df.columns]
    report_df = report_df[existing_columns]
    column_renames = {'STUDENT_ID': 'Student ID', 'DISTRICT_NAME': 'District', 'SCHOOL_NAME': 'School', 'STUDENT_GRADE_LEVEL': 'Grade', 'Predicted_Attendance': 'Predicted Attendance %', 'RISK_SCORE': 'Risk Score', 'RISK_LEVEL': 'Risk Level'}
    rename_dict = {k: v for k, v in column_renames.items() if k in report_df.columns}
    report_df.rename(columns=rename_dict, inplace=True)
    return report_df

@app.get('/api/filters/districts', response_model=List[Dict[str, str]])
async def get_districts():
    """Get list of all districts"""
    if not data_store.is_ready:
        raise HTTPException(status_code=503, detail='Data not loaded yet')
    try:
        if data_store.df is None:
            raise ValueError('Data store is empty')
        districts = data_store.df['DISTRICT_NAME'].unique()
        return [{'value': str(d), 'label': str(d)} for d in districts]
    except Exception as e:
        logger.error(f'Error fetching districts: {str(e)}')
        raise HTTPException(status_code=500, detail=f'Error fetching districts: {str(e)}')

@app.get('/api/filters/schools', response_model=List[Dict[str, str]])
async def get_schools(district: str):
    """Get schools for a specific district"""
    if not data_store.is_ready:
        raise HTTPException(status_code=503, detail='Data not loaded yet')
    try:
        if data_store.df is None:
            raise ValueError('Data store is empty')
        df = data_store.df[data_store.df['DISTRICT_NAME'] == district]
        schools = df['SCHOOL_NAME'].unique()
        return [{'value': str(s), 'label': str(s)} for s in schools]
    except Exception as e:
        logger.error(f'Error fetching schools: {str(e)}')
        raise HTTPException(status_code=500, detail=f'Error fetching schools: {str(e)}')

@app.get('/api/filters/grades', response_model=List[Dict[str, str]])
async def get_grades(district: str, school: str):
    """Get grades for a specific district and school"""
    if not data_store.is_ready:
        raise HTTPException(status_code=503, detail='Data not loaded yet')
    try:
        if data_store.df is None:
            raise ValueError('Data store is empty')
        df = data_store.df[(data_store.df['DISTRICT_NAME'] == district) & (data_store.df['SCHOOL_NAME'] == school)]
        grade_column = 'STUDENT_GRADE_LEVEL' if 'STUDENT_GRADE_LEVEL' in df.columns else 'GRADE_LEVEL'
        if grade_column not in df.columns:
            raise ValueError(f"Grade column '{grade_column}' not found in data")
        grades = df[grade_column].unique()
        return [{'value': str(g), 'label': str(g)} for g in grades]
    except Exception as e:
        logger.error(f'Error fetching grades: {str(e)}')
        raise HTTPException(status_code=500, detail=f'Error fetching grades: {str(e)}')
if __name__ == '__main__':
    import uvicorn
    import logging
    logging.basicConfig(level=logging.DEBUG)
    logger = logging.getLogger('uvicorn')
    logger.setLevel(logging.DEBUG)
    uvicorn.run('main:app', host='127.0.0.1', port=8001, reload=True, log_level='debug')