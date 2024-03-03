const readline = require('readline');
const fs = require('fs');
const path = require('path');

// I FINALLY GOT THE JSON FILES WORKING RIGHT... THAT WAS ANNOYING FOR A BIT
const contactsPath = path.resolve(__dirname, 'contacts.json');
const callHistoryPath = path.resolve(__dirname, 'call_history.json');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

class Phone {
  constructor() {
    this.contacts = [];
    this.observers = [];
    this.loadContactsFromJSON();
    this.loadCallHistoryFromJSON();
    this.regexPattern = /^(0[0-9]{10}|\+[0-9]{13})$/;
  }

  addPhoneNumber(phoneNumber, name) {
    if (this.regexPattern.test(phoneNumber)) {
      this.contacts.push({ name, phoneNumber });
      this.saveContactsToJSON();
    } else {
      console.log(`Invalid phone number format: ${phoneNumber}`);
    }
  }

  removePhoneNumber(phoneNumber) {
    this.contacts = this.contacts.filter(contact => contact.phoneNumber !== phoneNumber);
    this.saveContactsToJSON();
  }

  dialPhoneNumber(input) {
    let phoneNumber = input;
    let contactName = input;

    const contact = this.contacts.find(c => c.phoneNumber === input);
    if (contact) {
      contactName = contact.name;
      phoneNumber = contact.phoneNumber;
    } else {
      console.log(`Phone number ${input} not found in contacts`);
      return;
    }

    this.addCallToHistory(phoneNumber);
    this.notifyObservers(phoneNumber, "Now Dialing");
  }
  // TO ADD AN OBSERVER
  addObserver(observer) {
    this.observers.push(observer);
  }

  // TO REMOVE AN OBSERVER 
  removeObserver(observer) {
    const index = this.observers.indexOf(observer);
    if (index !== -1) {
      this.observers.splice(index, 1);
    }
  }
  // THE OBSERVER NOTIFIER 
  notifyObservers(phoneNumber, action) {
    for (const observer of this.observers) {
      observer.update(phoneNumber, action);
    }
  }
  // METHOD TO DISPLAY CALL HISTORY FOR ALL CONTACTS. i TOOK IT OFF THE MAIN MENU. MAYBE I SHOULD PUT IT BACK IN
  displayCallHistory() {
    console.log("Call History:");
    for (const call of this.callHistory) {
      const phoneNumber = call.phoneNumber;
      const timestamp = call.timestamp;
      const contact = this.contacts.find(c => c.phoneNumber === phoneNumber);
      const contactName = contact ? contact.name : "Unknown";
      console.log(`Contact Name: ${contactName}, Phone Number: ${phoneNumber}, Timestamp: ${timestamp}`);
    }
    mainMenu();
  }

  displayCalllog(contact) {
    console.log(`Call History for ${contact.name}:`);
    for (const call of this.callHistory) {
      if (call.phoneNumber === contact.phoneNumber) {
        console.log(`Phone Number: ${call.phoneNumber}, Timestamp: ${call.timestamp}`);
      }
    }
  }
  // METHOD TO SAVE CONTACTS TO CONTACTS.JSON
  saveContactsToJSON() {
    fs.writeFileSync(contactsPath, JSON.stringify(this.contacts, null, 2));
  }
  // METHOD TO LOAD CONTACTS FROM CONTACTS.JSON AND PARSE THE DATA SO ITS USEABLE 
  loadContactsFromJSON() {
    if (fs.existsSync(contactsPath)) {
      this.contacts = JSON.parse(fs.readFileSync(contactsPath, 'utf8'));
    } else {
      fs.writeFileSync(contactsPath, '[]');
    }
  }
  // METHOD TO SAVE DATA TO CALL_HISTORY.JSON
  saveCallHistoryToJSON() {
    fs.writeFileSync(callHistoryPath, JSON.stringify(this.callHistory, null, 2));
  }

  //LOADS CALL HISTORY FROM CALL_HISTORY.JSON
  loadCallHistoryFromJSON() {
    if (fs.existsSync(callHistoryPath)) {
      this.callHistory = JSON.parse(fs.readFileSync(callHistoryPath, 'utf8'));
    } else {
      fs.writeFileSync(callHistoryPath, '[]');
    }
  }

  // ADDS CALL LOG DATA TO CALL_HISTORY.JSON
  addCallToHistory(phoneNumber) {
    this.callHistory.push({ phoneNumber, timestamp: new Date().toISOString() });
    this.saveCallHistoryToJSON();
  }
  // DISPLAY CONTACTS METHOD 
  displayContacts() {
    console.log("Contacts:");
    for (let i = 0; i < this.contacts.length; i++) {
      console.log(`${i + 1}: ${this.contacts[i].name}: ${this.contacts[i].phoneNumber}`);
    }
  }

  // EDIT CONTACT METHOD
  editContact(name, newPhoneNumber) {
    const contact = this.contacts.find(c => c.name === name);
    if (contact) {
      contact.phoneNumber = newPhoneNumber;
      this.saveContactsToJSON();
    } else {
      console.log(`Contact ${name} not found`);
    }
  }
}

// CREATING FIRST OBSERVER CLASS... OBSERVER, REMINDS ME OF THE WATCHERS 
class Observer {
  constructor(phone) {
    this.phone = phone;
    this.phone.addObserver(this);
  }

  // UPDATING WATCHER... ERR, OBSERVER
  update(phoneNumber, action) {
    console.log(`Observer1: ${phoneNumber}`);
  }
}

// BIRTHING SECOND OBSERVER
class Observer2 {
  constructor(phone) {
    this.phone = phone;
    this.phone.addObserver(this);
  }

  // UPDATING SECOND OBSERVER 
  update(phoneNumber, action) {
    const last10Digits = phoneNumber.slice(-10);
    console.log(`Observer2: Now Dialing ${last10Digits}`);
  }
}

// FUNCTION TO ADD A NEW CONTACT THROUGH INTERFACE INPUT 
function addContact(phone) {
  rl.question("Enter contact name: ", (name) => {
    rl.question("Enter contact phone number(080 or +234 format): ", (phoneNumber) => {
      phone.addPhoneNumber(phoneNumber, name);
      console.log(`New contact ${name} saved.`);
      mainMenu(phone);
    });
  });
}

// FUNCTION TO DIAL THROUGH INTERFACE INPUT. WON'T WORK IF CONTACT IS UNSAVED. 
function dialPhoneNumber(phone) {
  rl.question("Enter phone number: ", (input) => {
    const contact = phone.contacts.find(c => c.phoneNumber === input);
    if (contact) {
      phone.dialPhoneNumber(input);
    } else {
      console.log(`Phone number ${input} not found in contacts`);
    }
    mainMenu(phone);
  });
}

// TO VIEW CONTACTS AND APPLY METHODS TO THE SELECTED  CONTACT
function viewContacts(phone) {
  phone.displayContacts();
  rl.question("Enter the index of the contact you want to interact with: ", (index) => {
    index = parseInt(index) - 1;
    if (index < 0 || index >= phone.contacts.length) {
      console.log("Invalid contact index");
      mainMenu(phone);
      return;
    }
    // CHOOSE A CONTACT 
    const contact = phone.contacts[index];
    rl.question(`Do you want to (1) dial ${contact.name}, (2) edit ${contact.name}, (3) remove ${contact.name}, (4) view call history \n(5) or go back to the main menu `, (answer) => {
      switch (answer) {
        case '1':
          phone.dialPhoneNumber(contact.phoneNumber);
          console.log(`Calling ${contact.name}`)
          mainMenu(phone);
          break;
        case '2':
          rl.question("Enter new phone number: ", (newPhoneNumber) => {
            phone.editContact(contact.name, newPhoneNumber);
            console.log(`Contact ${contact.name} edited successfully.`);
            mainMenu(phone);
          });
          break;
        case '3':
          phone.removePhoneNumber(contact.phoneNumber);
          console.log(`Contact ${contact.name} erased successfully.`);
          mainMenu(phone);
          break;
        case '4':
          console.log(`Loading contact history...`);
          phone.displayCalllog(contact);
          mainMenu(phone);
          break;
        case '5':
          console.log("Going back...")
          mainMenu(phone);
          break;
        default:
          console.log("Invalid choice");
          mainMenu(phone);
          break;
      }
    });
  });
}


function mainMenu(phone) {
  rl.question("What do you want to do? \n(1) Add new contact, \n(2) Dial phone number, \n(3) View contacts list, \n(4) View call logs: ", (answer) => {
    switch (answer) {
      case '1':
        addContact(phone);
        break;
      case '2':
        dialPhoneNumber(phone);
        break;
      case '3':
        viewContacts(phone);
        mainMenu(phone);
        break;
      case '4':
        phone.displayCallHistory();
        mainMenu(phone);
        break;
      default:
        console.log("Invalid choice");
        mainMenu(phone);
        break;
    }
  });
}

const phone = new Phone();
const observer = new Observer(phone);

const observer2 = new Observer2(phone);
mainMenu(phone);
