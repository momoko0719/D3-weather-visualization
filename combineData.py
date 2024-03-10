import pandas as pd

def preprocess_data(filepath):
    # Load the data
    data = pd.read_csv(filepath)
    # Parse the date and extract year and month
    data['date'] = pd.to_datetime(data['date'])
    data['year'] = data['date'].dt.year
    data['month'] = data['date'].dt.month
    # Calculate the monthly mean for actual precipitation and mean temperature
    monthly_data = data.groupby(['year', 'month']).agg({
        'actual_precipitation': 'mean',
        'actual_mean_temp': 'mean',
        'actual_min_temp': 'mean',
        'actual_max_temp': 'mean'
    }).reset_index()
    # Add city identifier based on the file name
    monthly_data['city'] = filepath.split('/')[-1].split('.')[0]
    return monthly_data

# File paths
clt_path = 'data/CLT.csv'
cqt_path = 'data/CQT.csv'
ind_path = 'data/IND.csv'
jax_path = 'data/JAX.csv'

# Preprocess the data for all cities
clt_monthly = preprocess_data(clt_path)
cqt_monthly = preprocess_data(cqt_path)
ind_monthly = preprocess_data(ind_path)
jax_monthly = preprocess_data(jax_path)

# Combine all cities data into a single DataFrame
all_data = pd.concat([clt_monthly, cqt_monthly, ind_monthly, jax_monthly], ignore_index=True)

# Save the processed data to a new CSV file
combined_csv_path = 'data/weather_data.csv'
all_data.to_csv(combined_csv_path, index=False)

combined_csv_path