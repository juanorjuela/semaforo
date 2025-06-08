// Wait for DOM to load
document.addEventListener('DOMContentLoaded', function() {
    // Check if Firebase is initialized
    if (firebase.apps.length) {
        console.log('Firebase initialized successfully');
        initializeApp();
    } else {
        console.error('Firebase initialization failed');
    }
});

function initializeApp() {
    // Initialize Firebase services
    const auth = firebase.auth();
    const db = firebase.firestore();

    // Add your app logic here
    console.log('App initialized and ready to use!');
}

// Example function to interact with Firebase
async function exampleFirebaseInteraction() {
    try {
        const db = firebase.firestore();
        const testCollection = await db.collection('test').get();
        console.log('Firebase connection test successful');
    } catch (error) {
        console.error('Firebase interaction error:', error);
    }
} 