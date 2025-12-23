# Database Setup for Web App

You need to create an additional table in Supabase for the site settings feature.

## Step 1: Create `user_settings` Table

1. Go to your Supabase dashboard → **Table Editor**
2. Click **New Table**
3. Name: `user_settings`
4. Add these columns:

| Column Name | Type | Default Value | Nullable | Description |
|------------|------|--------------|----------|-------------|
| id | uuid | `gen_random_uuid()` | No (Primary Key) | Unique ID |
| user_id | uuid | - | No | References auth.users |
| enabled_sites | jsonb | `["*"]` | Yes | Array of enabled site domains stored as JSON |
| created_at | timestamptz | `now()` | No | Creation timestamp |
| updated_at | timestamptz | `now()` | No | Update timestamp |

**Important for `enabled_sites` column:**
- Select **Type**: `jsonb`
- Default value: Type `["*"]` (JSON array format with quotes around the asterisk)

5. Click **Save**

## Step 2: Set Up Row Level Security (RLS)

1. Go to **Table Editor** → `user_settings`
2. Click **Enable RLS**
3. Go to **Authentication** → **Policies**
4. Create these policies:

### Policy 1: Users can read their own settings
- **Policy Name**: `Users can read their own settings`
- **Allowed Operation**: `SELECT`
- **Policy Definition**:
  ```sql
  (auth.uid() = user_id)
  ```

### Policy 2: Users can insert their own settings
- **Policy Name**: `Users can insert their own settings`
- **Allowed Operation**: `INSERT`
- **Policy Definition**:
  ```sql
  (auth.uid() = user_id)
  ```

### Policy 3: Users can update their own settings
- **Policy Name**: `Users can update their own settings`
- **Allowed Operation**: `UPDATE`
- **Policy Definition**:
  ```sql
  (auth.uid() = user_id)
  ```

### Policy 4: Users can delete their own settings
- **Policy Name**: `Users can delete their own settings`
- **Allowed Operation**: `DELETE`
- **Policy Definition**:
  ```sql
  (auth.uid() = user_id)
  ```

## Step 3: Add Updated At Trigger (Optional but Recommended)

To automatically update the `updated_at` timestamp:

1. Go to **SQL Editor** in Supabase
2. Run this SQL:

```sql
-- Create the function (if it doesn't exist, this will work)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Drop trigger if it exists, then create it
DROP TRIGGER IF EXISTS update_user_settings_updated_at ON user_settings;

CREATE TRIGGER update_user_settings_updated_at BEFORE UPDATE
ON user_settings FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();
```

**Note:** If you get an error that the trigger already exists, it means it's already set up correctly. You can skip this step!

## How It Works

- `enabled_sites` is a text array that stores domain names
- `['*']` means extension is enabled on all sites
- `['amazon.com', 'ebay.com']` means extension only works on those specific sites
- When user toggles settings in the web app, this table is updated
- Extension checks this table before showing the modal

## Testing

1. Sign up/login in the web app
2. Go to Settings
3. Toggle "All Websites" off
4. Add a specific site like "amazon.com"
5. Extension should only work on amazon.com now

