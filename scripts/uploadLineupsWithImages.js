// scripts/uploadLineupsWithImages.js
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');
const fs = require('fs');

// Initialize Firebase Admin (bypasses all security rules)
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  storageBucket: "cs2-tactics-d229a.firebasestorage.app"
});

const db = admin.firestore();
const bucket = admin.storage().bucket();

// Load Textbook account UID from environment variable
const TEXTBOOK_UID = process.env.TEXTBOOK_UID;

if (!TEXTBOOK_UID) {
  console.error('❌ ERROR: TEXTBOOK_UID not found in environment variables');
  console.error('📍 Create a .env file in the scripts folder with:');
  console.error('   TEXTBOOK_UID=your-textbook-user-uid');
  console.error('📍 See .env.example for reference');
  process.exit(1);
}

// Path to your images folder
const IMAGES_BASE_PATH = path.join(__dirname, '..', 'assets', 'lineup_images');

// All your lineup data with image filenames
const LINEUPS = [
  // DUST II - T SIDE
  {
    title: "Long Cross Smoke from T Spawn",
    description: "Smoke long cross from T spawn. Stand at the edge of T spawn, aim at the corner of the building, and throw.",
    mapId: "dust2",
    side: "T",
    site: "A",
    nadeType: "Smoke",
    isTextbook: true,
    throwType: "Standing throw",
    standImage: "dust2_long_cross_smoke_stand.png",
    aimImage: "dust2_long_cross_smoke_aim.png",
    landImage: "dust2_long_cross_smoke_land.png"
  },
  {
    title: "A Door Smoke",
    description: "Smoke A door from CT spawn. Essential smoke for A site control.",
    mapId: "dust2",
    side: "CT",
    site: "A",
    nadeType: "Smoke",
    isTextbook: true,
    throwType: "Standing throw",
    standImage: "dust2_a_door_smoke_stand.png",
    aimImage: "dust2_a_door_smoke_aim.png",
    landImage: "dust2_a_door_smoke_land.png"
  },
  {
    title: "Xbox Smoke from T Spawn",
    description: "Smoke xbox from T spawn. Stand behind the box at T spawn, aim at the antenna, and jumpthrow.",
    mapId: "dust2",
    side: "T",
    site: "Mid",
    nadeType: "Smoke",
    isTextbook: true,
    throwType: "Jump throw",
    standImage: "dust2_xbox_smoke_stand.png",
    aimImage: "dust2_xbox_smoke_aim.png",
    landImage: "dust2_xbox_smoke_land.png"
  },
  {
    title: "B Doors Smoke from Tunnels",
    description: "Smoke B doors from upper tunnels. Position in the middle of upper tunnels, aim at the top of the door frame, and throw.",
    mapId: "dust2",
    side: "T",
    site: "B",
    nadeType: "Smoke",
    isTextbook: true,
    throwType: "Standing throw",
    standImage: "dust2_b_door_smoke_stand.png",
    aimImage: "dust2_b_door_smoke_aim.png",
    landImage: "dust2_b_door_smoke_land.png"
  },
  {
    title: "Cat Cross Smoke",
    description: "Smoke catwalk cross from lower tunnels. Prevents CT rotation through cat.",
    mapId: "dust2",
    side: "T",
    site: "A",
    nadeType: "Smoke",
    isTextbook: true,
    throwType: "Standing throw",
    standImage: "dust2_cat_cross_smoke_stand.png",
    aimImage: "dust2_cat_cross_smoke_aim.png",
    landImage: "dust2_cat_cross_smoke_land.png"
  },

  // DUST II - CT SIDE
  {
    title: "A Long Car Self Flash",
    description: "Self flash for A long car position. Useful for peeking long aggressively.",
    mapId: "dust2",
    side: "CT",
    site: "A",
    nadeType: "Flash",
    isTextbook: true,
    throwType: "Standing throw",
    standImage: "dust2_a_long_car_self_flash_stand.png",
    aimImage: "dust2_a_long_car_self_flash_aim.png",
    landImage: "dust2_a_long_car_self_flash_land.png"
  },
  {
    title: "B Entrance Smoke",
    description: "Smoke B entrance from tunnels exit. Good for retakes and post-plant situations.",
    mapId: "dust2",
    side: "CT",
    site: "B",
    nadeType: "Smoke",
    isTextbook: true,
    throwType: "Standing throw",
    standImage: "dust2_b_entrance_smoke_stand.png",
    aimImage: "dust2_b_entrance_smoke_aim.png",
    landImage: "dust2_b_entrance_smoke_land.png"
  },
  {
    title: "Mid Smoke from T Spawn",
    description: "Smoke mid doors from T spawn to prevent CT awpers from getting early picks.",
    mapId: "dust2",
    side: "T",
    site: "Mid",
    nadeType: "Smoke",
    isTextbook: true,
    throwType: "Standing throw",
    standImage: "dust2_mid_smoke_stand.png",
    aimImage: "dust2_mid_smoke_aim.png",
    landImage: "dust2_mid_smoke_land.png"
  },
  {
    title: "B Site Molotov",
    description: "Molotov B site default position. Useful for clearing common plant spots.",
    mapId: "dust2",
    side: "CT",
    site: "B",
    nadeType: "Molotov",
    isTextbook: true,
    throwType: "Standing throw",
    standImage: "dust2_b_site_molly_stand.png",
    aimImage: "dust2_b_site_molly_aim.png",
    landImage: "dust2_b_site_molly_land.png"
  },
  {
    title: "Mid Suicide Smoke",
    description: "Smoke suicide from CT spawn. Prevents T pushes through suicide.",
    mapId: "dust2",
    side: "CT",
    site: "Mid",
    nadeType: "Smoke",
    isTextbook: true,
    throwType: "Standing throw",
    standImage: "dust2_mid_suicide_smoke_stand.png",
    aimImage: "dust2_mid_suicide_smoke_aim.png",
    landImage: "dust2_mid_suicide_smoke_land.png"
  },

  // MIRAGE - T SIDE
  {
    title: "Connector Smoke from T Spawn",
    description: "Smoke connector from T spawn. Essential for A execute. Lineup from spawn and jumpthrow.",
    mapId: "mirage",
    side: "T",
    site: "A",
    nadeType: "Smoke",
    isTextbook: true,
    throwType: "Jump throw",
    standImage: "mirage_a_con_smoke_stand.png",
    aimImage: "mirage_a_con_smoke_aim.png",
    landImage: "mirage_a_con_smoke_land.png"
  },
  {
    title: "A Cross Smoke",
    description: "Smoke A cross from T spawn. Pair with CT smoke for full A site execute.",
    mapId: "mirage",
    side: "T",
    site: "A",
    nadeType: "Smoke",
    isTextbook: true,
    throwType: "Jump throw",
    standImage: "mirage_a_cross_smoke_stand.png",
    aimImage: "mirage_a_cross_smoke_aim.png",
    landImage: "mirage_a_cross_smoke_land.png"
  },
  {
    title: "CT Smoke from T Spawn",
    description: "Smoke CT from T spawn. Essential A site smoke. Aim at corner of building and jumpthrow.",
    mapId: "mirage",
    side: "T",
    site: "A",
    nadeType: "Smoke",
    isTextbook: true,
    throwType: "Jump throw",
    standImage: "mirage_a_ct_smoke_stand.png",
    aimImage: "mirage_a_ct_smoke_aim.png",
    landImage: "mirage_a_ct_smoke_land.png"
  },
  {
    title: "Window Smoke from T Apartments",
    description: "Smoke mid window from T apartments. Prevents AWP from window position.",
    mapId: "mirage",
    side: "T",
    site: "Mid",
    nadeType: "Smoke",
    isTextbook: true,
    throwType: "Standing throw",
    standImage: "mirage_mid_window_smoke_stand.png",
    aimImage: "mirage_mid_window_smoke_aim.png",
    landImage: "mirage_mid_window_smoke_land.png"
  },
  {
    title: "Cat Smoke from Mid",
    description: "Smoke cat from mid. Useful for B split executes.",
    mapId: "mirage",
    side: "T",
    site: "B",
    nadeType: "Smoke",
    isTextbook: true,
    throwType: "Standing throw",
    standImage: "mirage_cat_smoke_stand.png",
    aimImage: "mirage_cat_smoke_aim.png",
    landImage: "mirage_cat_smoke_land.png"
  },
  {
    title: "CT/Cross/Stairs Smoke",
    description: "Triple smoke lineup covering CT, cross, and stairs. Essential for A executes.",
    mapId: "mirage",
    side: "T",
    site: "A",
    nadeType: "Smoke",
    isTextbook: true,
    throwType: "Jump throw",
    standImage: "mirage_a_ct_cross_stairs_smoke_stand.png",
    aimImage: "mirage_a_ct_cross_stairs_smoke_aim_ct.png",
    landImage: "mirage_a_ct_cross_stairs_smoke_land_ct.png"
  },
  {
    title: "B Window/Door/Cat Smoke",
    description: "Triple smoke lineup for B execute covering window, door, and cat.",
    mapId: "mirage",
    side: "T",
    site: "B",
    nadeType: "Smoke",
    isTextbook: true,
    throwType: "Standing throw",
    standImage: "mirage_b_window_door_cat_smoke_stand.png",
    aimImage: "mirage_b_window_door_cat_smoke_aim_window.png",
    landImage: "mirage_b_window_door_cat_smoke_land_window.png"
  }
];

// Upload a single image to Firebase Storage using Admin SDK
async function uploadImage(filePath, storagePath) {
  try {
    // Upload file using Admin SDK (bypasses security rules)
    await bucket.upload(filePath, {
      destination: storagePath,
      metadata: {
        contentType: 'image/png',
        cacheControl: 'public, max-age=31536000',
      }
    });
    
    // Make file publicly readable
    const file = bucket.file(storagePath);
    await file.makePublic();
    
    // Get public download URL
    const publicUrl = `https://storage.googleapis.com/${bucket.name}/${storagePath}`;
    
    return publicUrl;
  } catch (error) {
    console.error(`Error uploading ${filePath}:`, error.message);
    throw error;
  }
}

// Main migration function
async function migrateLineupsWithImages() {
  console.log('🚀 Starting lineup migration with image uploads...\n');
  
  // Check if images folder exists
  if (!fs.existsSync(IMAGES_BASE_PATH)) {
    console.error(`❌ ERROR: Images folder not found at: ${IMAGES_BASE_PATH}`);
    console.error('📍 Make sure your images are in: assets/lineup_images/\n');
    process.exit(1);
  }
  
  console.log(`📊 Total lineups to migrate: ${LINEUPS.length}`);
  console.log(`👤 Creator UID: ${TEXTBOOK_UID}`);
  console.log(`📁 Images folder: ${IMAGES_BASE_PATH}\n`);
  console.log('This will take 5-10 minutes (uploading images)...\n');
  
  let successCount = 0;
  let errorCount = 0;
  let uploadedImages = 0;
  const totalImages = LINEUPS.length * 3;

  for (let i = 0; i < LINEUPS.length; i++) {
    const lineup = LINEUPS[i];
    
    try {
      console.log(`\n[${i + 1}/${LINEUPS.length}] Processing: ${lineup.title}`);
      
      // Generate lineup ID
      const lineupId = `lineup_${Date.now()}_${i}`;
      
      // Upload images to Firebase Storage
      console.log('  ⬆️  Uploading stand image...');
      const standImagePath = path.join(IMAGES_BASE_PATH, lineup.standImage);
      const standImageURL = await uploadImage(
        standImagePath,
        `lineups/${lineupId}/stand.png`
      );
      uploadedImages++;

      console.log('  ⬆️  Uploading aim image...');
      const aimImagePath = path.join(IMAGES_BASE_PATH, lineup.aimImage);
      const aimImageURL = await uploadImage(
        aimImagePath,
        `lineups/${lineupId}/aim.png`
      );
      uploadedImages++;

      console.log('  ⬆️  Uploading land image...');
      const landImagePath = path.join(IMAGES_BASE_PATH, lineup.landImage);
      const landImageURL = await uploadImage(
        landImagePath,
        `lineups/${lineupId}/land.png`
      );
      uploadedImages++;

      // Upload optional fourth image if it exists
      let moreDetailsImageURL = null;
      if (lineup.moreDetailsImage) {
        console.log('  ⬆️  Uploading more details image...');
        const moreDetailsImagePath = path.join(IMAGES_BASE_PATH, lineup.moreDetailsImage);
        moreDetailsImageURL = await uploadImage(
          moreDetailsImagePath,
          `lineups/${lineupId}/moreDetails.png`
        );
        uploadedImages++;
      }

      // Create Firestore document with real image URLs
      const lineupData = {
        title: lineup.title,
        description: lineup.description,
        mapId: lineup.mapId,
        side: lineup.side,
        site: lineup.site,
        nadeType: lineup.nadeType,
        throwType: lineup.throwType || "Standing throw",
        isTextbook: lineup.isTextbook,
        
        // Real Firebase Storage URLs
        standImage: standImageURL,
        aimImage: aimImageURL,
        landImage: landImageURL,
        moreDetailsImage: moreDetailsImageURL,

        // Creator info (Textbook account)
        creatorId: TEXTBOOK_UID,
        creatorUsername: 'Textbook',
        creatorAvatar: null,
        creatorVerified: true,
        
        // Status
        isPublic: true,
        isDraft: false,
        
        // Stats
        upvotes: 0,
        views: 0,
        favorites: 0,
        
        // Timestamps
        uploadedAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      };

      // Save to Firestore
      console.log('  💾 Saving to Firestore...');
      const docRef = await db.collection('lineups').add(lineupData);
      
      successCount++;
      console.log(`  ✅ Success! (Doc ID: ${docRef.id})`);
      console.log(`  📊 Progress: ${uploadedImages}/${totalImages} images uploaded`);
      
    } catch (error) {
      errorCount++;
      console.error(`  ❌ Failed: ${error.message}`);
      
      // If image file not found, show helpful error
      if (error.code === 'ENOENT') {
        console.error(`  📍 Image file not found. Check: ${IMAGES_BASE_PATH}`);
        console.error(`  📍 Looking for: ${lineup.standImage}`);
      }
    }
  }

  console.log('\n' + '='.repeat(70));
  console.log('📊 Migration Complete!');
  console.log('='.repeat(70));
  console.log(`✅ Successful lineups: ${successCount}`);
  console.log(`❌ Failed lineups: ${errorCount}`);
  console.log(`📈 Total lineups: ${LINEUPS.length}`);
  console.log(`🖼️  Total images uploaded: ${uploadedImages}/${totalImages}`);
  console.log('');
  
  if (successCount === LINEUPS.length) {
    console.log('🎉 All lineups and images migrated successfully!');
    console.log('');
    console.log('Next steps:');
    console.log('1. Go to Firebase Console → Firestore → lineups');
    console.log('2. Verify you see lineup documents');
    console.log('3. Click one and check that standImage, aimImage, landImage are URLs');
    console.log('4. Go to Storage → Files → lineups/ → See all uploaded images');
    console.log('5. Your app will now load images directly from Firebase Storage!');
  } else {
    console.log('⚠️  Some lineups failed to migrate. Check errors above.');
  }
  
  process.exit(0);
}

// Run migration
migrateLineupsWithImages().catch(error => {
  console.error('💥 Fatal error:', error);
  process.exit(1);
});