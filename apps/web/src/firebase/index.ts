import firebase from 'firebase/app'
import 'firebase/storage'

import { environment } from '../env'

if (firebase.apps.length === 0) {
  firebase.initializeApp(environment.FIREBASE_CONFIG)
}

const storage = firebase.storage()

export { storage, firebase as default }
