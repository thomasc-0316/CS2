// scripts/migrateLineups.js
const { initializeApp } = require('firebase/app');
const { getFirestore, collection, addDoc, serverTimestamp } = require('firebase/firestore');

// Your Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyAW0PbcufDW1qcG4RkFOC1lezThYSl3_pI",
  authDomain: "cs2-tactics-d229a.firebaseapp.com",
  projectId: "cs2-tactics-d229a",
  storageBucket: "cs2-tactics-d229a.firebasestorage.app",
  messagingSenderId: "563685919534",
  appId: "1:563685919534:web:b6102ba41164d0460908bf",
  measurementId: "G-JZP3TKLR67"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// ⚠️ IMPORTANT: Replace with the actual Firebase Auth UID of Textbook account
// Get this from Firebase Console → Authentication → Users → textbook@cs2tactics.com
const TEXTBOOK_UID = 'cXXmXsJittW5QQ7ILuYttnMu11e2';

// All your lineup data (keeping local image paths for now)
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
    // Using local images for now - app will use require()
    standImage: "dust2_t_long_cross_stand",
    aimImage: "dust2_t_long_cross_aim",
    landImage: "dust2_t_long_cross_land"
  },
  {
    title: "A Site CT Smoke from Long",
    description: "Smoke CT on A site from long. Position at the corner near long doors, aim at the top of the building, and throw.",
    mapId: "dust2",
    side: "T",
    site: "A",
    nadeType: "Smoke",
    isTextbook: true,
    standImage: "dust2_t_ct_smoke_stand",
    aimImage: "dust2_t_ct_smoke_aim",
    landImage: "dust2_t_ct_smoke_land"
  },
  {
    title: "Xbox Smoke from T Spawn",
    description: "Smoke xbox from T spawn. Stand behind the box at T spawn, aim at the antenna, and jumpthrow.",
    mapId: "dust2",
    side: "T",
    site: "Mid",
    nadeType: "Smoke",
    isTextbook: true,
    standImage: "dust2_t_xbox_stand",
    aimImage: "dust2_t_xbox_aim",
    landImage: "dust2_t_xbox_land"
  },
  {
    title: "B Doors Smoke from Tunnels",
    description: "Smoke B doors from upper tunnels. Position in the middle of upper tunnels, aim at the top of the door frame, and throw.",
    mapId: "dust2",
    side: "T",
    site: "B",
    nadeType: "Smoke",
    isTextbook: true,
    standImage: "dust2_t_b_doors_stand",
    aimImage: "dust2_t_b_doors_aim",
    landImage: "dust2_t_b_doors_land"
  },
  {
    title: "Cat Flash from Long",
    description: "Flash catwalk from long. Throw the flash high over the wall so it pops as players peek from cat.",
    mapId: "dust2",
    side: "T",
    site: "A",
    nadeType: "Flash",
    isTextbook: true,
    standImage: "dust2_t_cat_flash_stand",
    aimImage: "dust2_t_cat_flash_aim",
    landImage: "dust2_t_cat_flash_land"
  },

  // DUST II - CT SIDE
  {
    title: "Long Doors Molotov from A Site",
    description: "Molotov long doors from A site. Useful for stopping T pushes. Aim at the corner and throw.",
    mapId: "dust2",
    side: "CT",
    site: "A",
    nadeType: "Molotov",
    isTextbook: true,
    standImage: "dust2_ct_long_molly_stand",
    aimImage: "dust2_ct_long_molly_aim",
    landImage: "dust2_ct_long_molly_land"
  },
  {
    title: "B Site Default Smoke from Tunnels Exit",
    description: "Smoke default plant spot on B from tunnels exit. Good for retakes.",
    mapId: "dust2",
    side: "CT",
    site: "B",
    nadeType: "Smoke",
    isTextbook: true,
    standImage: "dust2_ct_b_default_stand",
    aimImage: "dust2_ct_b_default_aim",
    landImage: "dust2_ct_b_default_land"
  },
  {
    title: "Mid Doors Smoke from CT Spawn",
    description: "Smoke mid doors from CT spawn to prevent T awpers from getting early picks.",
    mapId: "dust2",
    side: "CT",
    site: "Mid",
    nadeType: "Smoke",
    isTextbook: true,
    standImage: "dust2_ct_mid_doors_stand",
    aimImage: "dust2_ct_mid_doors_aim",
    landImage: "dust2_ct_mid_doors_land"
  },
  {
    title: "Xbox Molotov from CT Spawn",
    description: "Molotov xbox from CT spawn. Useful for clearing common spots.",
    mapId: "dust2",
    side: "CT",
    site: "Mid",
    nadeType: "Molotov",
    isTextbook: true,
    standImage: "dust2_ct_xbox_molly_stand",
    aimImage: "dust2_ct_xbox_molly_aim",
    landImage: "dust2_ct_xbox_molly_land"
  },
  {
    title: "Long Flash from A Site",
    description: "Flash long from A site. Bounces off the wall for a perfect pop flash.",
    mapId: "dust2",
    side: "CT",
    site: "A",
    nadeType: "Flash",
    isTextbook: true,
    standImage: "dust2_ct_long_flash_stand",
    aimImage: "dust2_ct_long_flash_aim",
    landImage: "dust2_ct_long_flash_land"
  },

  // MIRAGE - T SIDE
  {
    title: "Stairs Smoke from T Spawn",
    description: "Smoke stairs from T spawn. Essential for A execute. Lineup from spawn, aim at window edge, and throw.",
    mapId: "mirage",
    side: "T",
    site: "A",
    nadeType: "Smoke",
    isTextbook: true,
    standImage: "mirage_t_stairs_stand",
    aimImage: "mirage_t_stairs_aim",
    landImage: "mirage_t_stairs_land"
  },
  {
    title: "Jungle Smoke from T Spawn",
    description: "Smoke jungle from T spawn. Pair with CT smoke for full A site execute.",
    mapId: "mirage",
    side: "T",
    site: "A",
    nadeType: "Smoke",
    isTextbook: true,
    standImage: "mirage_t_jungle_stand",
    aimImage: "mirage_t_jungle_aim",
    landImage: "mirage_t_jungle_land"
  },
  {
    title: "CT Smoke from T Spawn",
    description: "Smoke CT from T spawn. Essential A site smoke. Aim at corner of building and jumpthrow.",
    mapId: "mirage",
    side: "T",
    site: "A",
    nadeType: "Smoke",
    isTextbook: true,
    standImage: "mirage_t_ct_stand",
    aimImage: "mirage_t_ct_aim",
    landImage: "mirage_t_ct_land"
  },
  {
    title: "Window Smoke from T Apartments",
    description: "Smoke mid window from T apartments. Prevents AWP from window position.",
    mapId: "mirage",
    side: "T",
    site: "Mid",
    nadeType: "Smoke",
    isTextbook: true,
    standImage: "mirage_t_window_stand",
    aimImage: "mirage_t_window_aim",
    landImage: "mirage_t_window_land"
  },
  {
    title: "Market Molotov from T Spawn",
    description: "Molotov market from T spawn. Clears common B site positions.",
    mapId: "mirage",
    side: "T",
    site: "B",
    nadeType: "Molotov",
    isTextbook: true,
    standImage: "mirage_t_market_stand",
    aimImage: "mirage_t_market_aim",
    landImage: "mirage_t_market_land"
  },
  {
    title: "Bench Molotov from Apartments",
    description: "Molotov bench from apartments. Useful for clearing the position.",
    mapId: "mirage",
    side: "T",
    site: "B",
    nadeType: "Molotov",
    isTextbook: true,
    standImage: "mirage_t_bench_stand",
    aimImage: "mirage_t_bench_aim",
    landImage: "mirage_t_bench_land"
  },
  {
    title: "A Ramp Flash from Palace",
    description: "Flash A ramp from palace. Bounces for perfect timing as you peek.",
    mapId: "mirage",
    side: "T",
    site: "A",
    nadeType: "Flash",
    isTextbook: true,
    standImage: "mirage_t_ramp_flash_stand",
    aimImage: "mirage_t_ramp_flash_aim",
    landImage: "mirage_t_ramp_flash_land"
  }
];

async function migrateLineups() {
  console.log('🚀 Starting lineup migration for Textbook account...');
  
  // Validation
  if (TEXTBOOK_UID === 'PASTE_TEXTBOOK_UID_HERE') {
    console.error('❌ ERROR: You must replace TEXTBOOK_UID with the actual Firebase Auth UID!');
    console.error('📍 Get it from: Firebase Console → Authentication → Users → textbook@cs2tactics.com');
    process.exit(1);
  }
  
  console.log(`📊 Total lineups to migrate: ${LINEUPS.length}`);
  console.log(`👤 Creator UID: ${TEXTBOOK_UID}`);
  console.log('');
  
  let successCount = 0;
  let errorCount = 0;

  for (let i = 0; i < LINEUPS.length; i++) {
    const lineup = LINEUPS[i];
    
    try {
      const lineupData = {
        ...lineup,
        
        // Creator info (Textbook account)
        creatorId: TEXTBOOK_UID,  // ← Real Firebase Auth UID
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
        uploadedAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      const docRef = await addDoc(collection(db, 'lineups'), lineupData);
      successCount++;
      console.log(`✅ [${i + 1}/${LINEUPS.length}] ${lineup.title}`);
      
    } catch (error) {
      errorCount++;
      console.error(`❌ [${i + 1}/${LINEUPS.length}] Failed: ${lineup.title}`);
      console.error(`   Error: ${error.message}`);
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log('📊 Migration Complete!');
  console.log('='.repeat(60));
  console.log(`✅ Successful: ${successCount}`);
  console.log(`❌ Failed: ${errorCount}`);
  console.log(`📈 Total: ${LINEUPS.length}`);
  console.log('');
  
  if (successCount === LINEUPS.length) {
    console.log('🎉 All lineups migrated successfully!');
    console.log('');
    console.log('Next steps:');
    console.log('1. Go to Firebase Console → Firestore → lineups');
    console.log('2. Verify you see 17 lineup documents');
    console.log('3. Check that creatorId matches your Textbook UID');
    console.log('4. Update your app to fetch from Firestore!');
  } else {
    console.log('⚠️  Some lineups failed to migrate. Check errors above.');
  }
  
  process.exit(0);
}

// Run migration
migrateLineups().catch(error => {
  console.error('💥 Fatal error:', error);
  process.exit(1);
});