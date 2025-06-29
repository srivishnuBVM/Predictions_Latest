import pandas as pd

# Path to your CSV file
csv_file_path = r"C:\Users\BVM\Downloads\AIP_CAD_Alerts_Dashboards-main\backend\Data\Predictions_final.csv"
parquet_file_path = r"C:\Users\BVM\Downloads\AIP_CAD_Alerts_Dashboards-main\backend\Data\predictions_final.parquet"
# Read CSV
df = pd.read_csv(csv_file_path)

# Write to Parquet
df.to_parquet(parquet_file_path, index=False)

