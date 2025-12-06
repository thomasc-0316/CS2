# Admin Scripts

⚠️ **SECURITY WARNING**: These scripts use Firebase Admin SDK and bypass all security rules. Never commit credentials to git.

## Setup (One-time)

### 1. Get Firebase Service Account Key

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select your project
3. Click ⚙️ → **Project settings** → **Service accounts**
4. Click **Generate new private key**
5. Save as `serviceAccountKey.json` in this folder
6. ✅ This file is already in `.gitignore` - it will NOT be committed

### 2. Create Environment Variables

1. Copy the example file:
   ```bash
   cp .env.example .env
   ```

2. Edit `.env` and add your Textbook user UID:
   ```
   TEXTBOOK_UID=your-actual-uid-here
   ```

3. To find your Textbook UID:
   - Firebase Console → Authentication → Users
   - Find the Textbook user → Copy UID

4. ✅ The `.env` file is already in `.gitignore` - it will NOT be committed

### 3. Prepare Images

Create the images folder and add your lineup images:
```bash
mkdir -p ../assets/lineup_images
```

Add your images with clear naming:
- `dust2_long_cross_smoke_stand.png`
- `dust2_long_cross_smoke_aim.png`
- `dust2_long_cross_smoke_land.png`
- `dust2_long_cross_smoke_details.png` (optional 4th image)

## Usage

### Upload Textbook Lineups

1. Edit `uploadLineupsWithImages.js` → Update the `LINEUPS` array
2. Run the script:
   ```bash
   node uploadLineupsWithImages.js
   ```

## Security Checklist

Before committing ANY changes:

- [ ] `serviceAccountKey.json` is in `.gitignore` ✅
- [ ] `.env` is in `.gitignore` ✅
- [ ] No hardcoded UIDs or credentials in code ✅
- [ ] No sensitive data in the LINEUPS array ✅

## What's Safe to Commit

✅ **Safe:**
- Script code itself
- `.env.example` (template only)
- Image filenames in LINEUPS array
- README documentation

❌ **NEVER commit:**
- `serviceAccountKey.json`
- `.env` file
- Any credentials or tokens
- Actual UIDs or sensitive data

## Files in This Folder

- `uploadLineupsWithImages.js` - Main upload script
- `.env.example` - Template for environment variables
- `serviceAccountKey.json` - ⚠️ YOUR SECRET (not committed)
- `.env` - ⚠️ YOUR CONFIG (not committed)
- `README.md` - This file
