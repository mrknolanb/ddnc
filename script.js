document.addEventListener('DOMContentLoaded', () => {

    let guestData = {};

    const letterContent = {
        en: {
            title: 'Room Cleaning Notification',
            body: `<p>Thank you for staying with us.</p><p>We would like to inform you that, in accordance with our hotel policy, rooms are cleaned on the third day after two consecutive days without cleaning. Please be advised that our staff will enter your room tomorrow for the scheduled cleaning.</p><p>We kindly ask that you place the “Clean Up” tag outside your door and return the “Do Not Disturb,” “No Cleaning,” or “Eco Cleaning” tags inside the room. Room cleaning is available between 10:00 AM and 2:00 PM.</p><p>If you have any questions, please feel free to contact us.</p><p>We appreciate your understanding and cooperation.<br>Thank you.</p>`
        },
        ja: {
            title: '客室清掃のお知らせ',
            body: `<p>ご宿泊いただき、誠にありがとうございます。</p><p>当ホテルのポリシーに基づき、2日間清掃が行われなかったお部屋につきましては、3日目に清掃を実施しております。つきましては、明日、客室清掃のためスタッフがお部屋に入室させていただきますので、予めご了承ください。</p><p>お部屋の外に「清掃してください（Clean Up）」の札をお出しいただき、「起こさないでください（Do Not Disturb）」等の札は室内にお戻しくださいますようお願いいたします。客室清掃は午前10時から午後2時の間で承っております。</p><p>ご不明な点がございましたら、お気軽にお問い合わせください。</p><p>何卒、ご理解ご協力のほど、よろしくお願い申し上げます。</p>`
        }
    };

    const letterLabels = {
        en: {
            roomNo: 'Room No:',
            guestName: 'Guest Name:',
            clerk: 'Clerk',
            date: 'Date:',
            frontDeskCopy: '[ FRONT DESK COPY ]',
            guestCopy: '[ GUEST COPY ]'
        },
        ja: {
            roomNo: '部屋番号:',
            guestName: 'お客様名:',
            clerk: '担当者',
            date: '日付:',
            frontDeskCopy: '[ フロント控え ]',
            guestCopy: '[ お客様控え ]'
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
     * UPDATED: Parses CSV text where Room No is in Column B and Name is in Column D.
     */
    const parseCSV = (csvText) => {
        const data = {};
        const lines = csvText.split(/\r\n|\n/);

        lines.forEach((line, index) => {
            const trimmedLine = line.trim();
            if (trimmedLine === '') return; // Skip empty lines

            const parts = trimmedLine.split(',');

            // Ensure the line has at least 4 columns to access D (index 3)
            if (parts.length < 4) {
                return; // Skip lines that are too short
            }

            // Column B is parts[1], Column D is parts[3]
            const roomColumn = parts[1] ? parts[1].trim() : '';
            const nameColumn = parts[3] ? parts[3].trim() : '';
            
            // Skip a header row if the room number column isn't a number
            if (index === 0 && isNaN(parseInt(roomColumn, 10))) {
                return; // Skips the header
            }

            // Only add the record if both a room number and a name exist
            if (roomColumn && nameColumn) {
                data[roomColumn] = nameColumn;
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
                uploadStatus.textContent = `✅ Success! ${recordCount} guest records loaded.`;
                uploadStatus.style.color = 'green';
                letterGenerationSection.classList.remove('hidden');
                roomEntryContainer.innerHTML = '';
                addRoomRow();
            } else {
                uploadStatus.textContent = '❌ Error: Could not find valid data in the CSV. Please check the column format.';
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
        roomRow.innerHTML = `<label for="room-${rowId}">Room Number:</label><input type="text" id="room-${rowId}" class="room-number-input" placeholder="e.g., 101"><span class="guest-name-display">[Guest Name]</span>`;
        roomEntryContainer.appendChild(roomRow);
        roomRow.querySelector('.room-number-input').addEventListener('keyup', handleRoomInput);
    };

    const handleRoomInput = (event) => {
        const input = event.target;
        const roomNumber = input.value.trim();
        const nameDisplay = input.nextElementSibling;
        nameDisplay.textContent = guestData[roomNumber] || 'Guest not found';
        nameDisplay.style.color = guestData[roomNumber] ? '#005a87' : '#dc3545';
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
            const guestName = guestData[roomNumber];

            if (guestName) {
                lettersGenerated++;
                const language = isJapaneseName(guestName) ? 'ja' : 'en';
                const content = letterContent[language];
                const labels = letterLabels[language];
                const letterClone = letterTemplate.content.cloneNode(true);

                letterClone.querySelectorAll('.title').forEach(el => el.innerHTML = content.title);
                letterClone.querySelectorAll('.data-room-number').forEach(el => el.textContent = roomNumber);
                letterClone.querySelectorAll('.data-guest-name').forEach(el => el.textContent = guestName);
                letterClone.querySelectorAll('.letter-body').forEach(el => el.innerHTML = content.body);
                letterClone.querySelectorAll('.data-date').forEach(el => el.textContent = today);
                letterClone.querySelectorAll('.data-clerk-name').forEach(el => el.textContent = clerkName);

                letterClone.querySelectorAll('.label-room-no').forEach(el => el.textContent = labels.roomNo);
                letterClone.querySelectorAll('.label-guest-name').forEach(el => el.textContent = labels.guestName);
                letterClone.querySelectorAll('.label-clerk').forEach(el => el.textContent = labels.clerk);
                letterClone.querySelectorAll('.label-date').forEach(el => el.textContent = labels.date);
                
                letterClone.querySelector('.front-desk-copy .copy-indicator').textContent = labels.frontDeskCopy;
                letterClone.querySelector('.guest-copy .copy-indicator').textContent = labels.guestCopy;

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
