# supabase database: Setup OAuth Credentials

This guide will walk you through setting up Google OAuth for your Supabase project.

## Prerequisites

- Access to your [Supabase Dashboard](https://supabase.com/dashboard)
- A Google Cloud account (free)

## Step 1: Create Google Cloud Project

1. Go to the [Google Cloud Console](https://console.cloud.google.com/).
2. Click the project dropdown at the top left and select **New Project**.
3. Name it `Tokyo Shoes Auth` (or similar) and click **Create**.
4. Select the new project from the notification or dropdown.

## Step 2: Configure OAuth Consent Screen

1. In the search bar at the top, type "OAuth consent screen" and select it.
2. Select **External** for User Type and click **Create**.
3. Fill in the required fields:
   - **App name**: `Tokyo Shoes Collection`
   - **User support email**: Your email
   - **Developer contact information**: Your email
4. Click **Save and Continue** until you reach the dashboard (you can skip Scopes and Test Users for now).

## Step 3: Create Credentials

1. Go to **Credentials** in the left menu.
2. Click **+ CREATE CREDENTIALS** > **OAuth client ID**.
3. Select **Web application** as the Application type.
4. Name it `Supabase Client`.
5. Under **Authorized redirect URIs**, you need to add your Supabase Callback URL.
   - Go to your Supabase Dashboard > Authentication > Providers > Google.
   - Copy the **Callback URL** (it looks like `https://<project-id>.supabase.co/auth/v1/callback`).
   - Paste it into the "Authorized redirect URIs" field in Google Cloud Console.
6. Click **Create**.
7. **IMPORTANT:** Copy user **Client ID** and **Client Secret**.

## Step 4: Configure Supabase

1. Go back to your [Supabase Dashboard](https://supabase.com/dashboard).
2. Navigate to **Authentication** > **Providers**.
3. Click on **Google**.
4. Toggle **Enable Google provider**.
5. Paste the **Client ID** and **Client Secret** you copied from Google.
6. Click **Save**.

## Step 5: Update Environment Variables

I have created a `.env` file for you. You need to verify it has your correct Supabase URL and Anon Key.
The OAuth flow is handled automatically by Supabase using the credentials you just saved in the Supabase Dashboard, so you don't need to add the Google keys to your `.env` file, only the Supabase URL and Anon Key are needed for the client to connect.

## Step 6: Test Login

Once the UI is connected, you will be able to sign in with Google!
