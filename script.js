document.addEventListener('DOMContentLoaded', () => {

    let guestData = {};

    const letterContent = {
        en: {
            title: 'Room Cleaning Notification',
            body: `<p>Thank you for staying with us.</p><p>In accordance with hotel policy, we clean rooms that have not been serviced for two consecutive days. Therefore, our staff will be entering your room for scheduled cleaning tomorrow between 10:00 AM and 2:00 PM.</p><p>Please place the “Clean Up” tag on your door. If you have any questions, please feel free to contact us.</p><p>We appreciate your understanding and cooperation.</p>`
        },
        ja: {
            title: '客室清掃のお知らせ',
            body: `<p>ご宿泊いただき、誠にありがとうございます。</p><p>当ホテルのポリシーに基づき、2日間清掃が行われなかったお部屋は、翌日に清掃を実施しております。つきましては、明日の午前10時から午後2時の間に、スタッフがお部屋の清掃に入室いたします。</p><p>お部屋のドアに「清掃してください」の札をお出しください。ご不明な点がございましたら、お気軽にお問い合わせください。</p><p>何卒、ご理解ご協力のほど、よろしくお願い申し上げます。</p>`
        }
    };

    const letterLabels = {
        en: {
            roomNo: 'Room No:',
            guestName: 'Guest Name:',
            clerk: 'Clerk',
            date: 'Date:',
            frontDeskCopy: '[ FRONT DESK COPY ]'
        },
        ja: {
            roomNo: '部屋番号:',
            guestName: 'お客様名:',
            clerk: '担当者',
            date: '日付:',
            frontDeskCopy: '[ フロント控え ]'
        }
    };

    const csvUploadInput = document.getElementById('csv-upload');
    const uploadStatus = document.getElementById('upload-status');
    const letterGenerationSection = document.getElementById('letter-generation-section');
    const roomEntryContainer = document.getElementById('room-entry-container');
    const addRoomBtn = document.getElementById('add-room-btn');
    const clerkNameInput = document.getElementById('clerk-name');
    const generateBtn = document.getElementById('generate-btn');
    const printArea = document.getElementById('print-area');
    const letterTemplate = document.getElementById('letter-template');

    /**
     * UPDATED: Now groups multiple guests per room and filters out numeric-only names.
     */
    const parseCSV = (csvText) => {
        // The data object will now hold an array of names for each room.
        const data = {};
        const lines = csvText.split(/\r\n|\n/);
        const unquote = (str) => str.replace(/^"|"$/g, '');
        // This regex checks if a string contains any letters (English or Japanese).
        const hasLetters = (str) => /[a-zA-Zァ-ヶーｦ-ﾟ]/.test(str);

        lines.forEach((line, index) => {
            const trimmedLine = line.trim();
            if (trimmedLine === '') return;
            
            const parts = trimmedLine.split(',');
            if (parts.length < 4) return;
            
            const roomColumn = parts[1] ? unquote(parts[1].trim()) : '';
            const nameColumn = parts[3] ? unquote(parts[3].trim()) : '';
            
            if (index === 0 && isNaN(parseInt(roomColumn, 10))) return;

            // Only process if the room number exists and the name is not just numbers.
            if (roomColumn && nameColumn && hasLetters(nameColumn)) {
                // If the room key doesn't exist yet, create it with an empty array.
                if (!data[roomColumn]) {
                    data[roomColumn] = [];
                }
                // Push the valid name into the array for that room.
                data[roomColumn].push(nameColumn);
            }
        });
        return data;
    };
    
    const handleFileUpload = (event) => {
        const file = event.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (e) => {
            const csvText = e.target.result;
            guestData = parseCSV(csvText);
            const recordCount = Object.keys(guestData).length;
            if (recordCount > 0) {
                uploadStatus.textContent = `✅ Success! ${recordCount} rooms loaded.`;
                uploadStatus.style.color = 'green';
                letterGenerationSection.classList.remove('hidden');
                roomEntryContainer.innerHTML = '';
                addRoomRow();
            } else {
                uploadStatus.textContent = '❌ Error: Could not find valid data. Please check the CSV file format.';
                uploadStatus.style.color = 'red';
                letterGenerationSection.classList.add('hidden');
            }
        };
        reader.onerror = () => {
             uploadStatus.textContent = '❌ Error: Could not read the file.';
             uploadStatus.style.color = 'red';
        };
        reader.readAsText(file, 'Shift-JIS');
    };

    const addRoomRow = () => {
        const rowId = `row-${Date.now()}`;
        const roomRow = document.createElement('div');
        roomRow.className = 'room-row';
        roomRow.innerHTML = `<label for="room-${rowId}">Room Number:</label><input type="text" id="room-${rowId}" class="room-number-input" placeholder="e.g., 501"><span class="guest-name-display">[Guest Name]</span>`;
        roomEntryContainer.appendChild(roomRow);
        roomRow.querySelector('.room-number-input').addEventListener('keyup', handleRoomInput);
    };

    /**
     * UPDATED: Now joins multiple guest names with a comma.
     */
    const handleRoomInput = (event) => {
        const input = event.target;
        const roomNumber = input.value.trim();
        const nameDisplay = input.nextElementSibling;
        
        const names = guestData[roomNumber]; // This is now an array of names
        
        if (names && names.length > 0) {
            nameDisplay.textContent = names.join(', '); // Join multiple names
            nameDisplay.style.color = '#005a87';
        } else {
            nameDisplay.textContent = 'Guest not found';
            nameDisplay.style.color = '#dc3545';
        }
    };
    
    const isJapaneseName = (str) => {
        return /[ァ-ヶーｦ-ﾟ]/.test(str);
    };

    const generateLetters = () => {
        const clerkName = clerkNameInput.value.trim();
        if (!clerkName) {
            alert('Please enter the clerk\'s name before generating letters.');
            return;
        }

        printArea.innerHTML = '';
        const roomRows = document.querySelectorAll('.room-row');
        const today = new Date().toLocaleDateString();
        let lettersGenerated = 0;

        roomRows.forEach(row => {
            const roomNumber = row.querySelector('.room-number-input').value.trim();
            const guestNames = guestData[roomNumber]; // This is an array

            if (guestNames && guestNames.length > 0) {
                lettersGenerated++;
                // Join the names for the letter, then check for Japanese characters
                const combinedGuestName = guestNames.join(', ');
                
                const language = isJapaneseName(combinedGuestName) ? 'ja' : 'en';
                const content = letterContent[language];
                const labels = letterLabels[language];
                const letterClone = letterTemplate.content.cloneNode(true);

                letterClone.querySelectorAll('.title').forEach(el => el.innerHTML = content.title);
                letterClone.querySelectorAll('.data-room-number').forEach(el => el.textContent = roomNumber);
                letterClone.querySelectorAll('.data-guest-name').forEach(el => el.textContent = combinedGuestName);
                letterClone.querySelectorAll('.letter-body').forEach(el => el.innerHTML = content.body);
                letterClone.querySelectorAll('.data-date').forEach(el => el.textContent = today);
                letterClone.querySelectorAll('.data-clerk-name').forEach(el => el.textContent = clerkName);
                
                letterClone.querySelectorAll('.label-room-no').forEach(el => el.textContent = labels.roomNo);
                letterClone.querySelectorAll('.label-guest-name').forEach(el => el.textContent = labels.guestName);
                letterClone.querySelectorAll('.label-clerk').forEach(el => el.textContent = labels.clerk);
                letterClone.querySelectorAll('.label-date').forEach(el => el.textContent = labels.date);
                
                letterClone.querySelector('.front-desk-copy .copy-indicator').textContent = labels.frontDeskCopy;

                printArea.appendChild(letterClone);
            }
        });
        
        if (lettersGenerated > 0) {
            window.print();
        } else {
            alert('No valid room numbers were entered. Please enter at least one valid room number from the list.');
        }
    };

    csvUploadInput.addEventListener('change', handleFileUpload);
    addRoomBtn.addEventListener('click', addRoomRow);
    generateBtn.addEventListener('click', generateLetters);
});
