document.addEventListener('DOMContentLoaded', () => {

    const logo = new Image();
    logo.src = 'remm.jpg';

    let guestData = {};

    const staffNameTranslations = {
        'NAKAYAMA': '中山',
        'TAKAMI': '髙見',
        'KANEKO A.': '金子 愛',
        'KANEKO T.': '金子 智',
        'KIYONAGA': '清永',
        'IWAI': '岩井',
        'MURABAYASHI': '村林',
        'ZHANG': '張',
        'YEN': 'グエン',
        'BIJAYA': 'ビザヤ',
        'MARK NOLAN': 'マークノラン',
        'UTSUGI': '宇津木',
        'MIYAKAWA': '宮川',
        'KOKUBU': '国分',
        'SAKAMOTO': '坂本',
        'OGAWA': '小川',
        'GUSHIKEN': '具志堅'
    };

    // NEW: Create a reversed translation map for Japanese-to-English lookup
    const japaneseToEnglish = Object.entries(staffNameTranslations).reduce((acc, [key, value]) => {
        acc[value] = key;
        return acc;
    }, {});

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

    const parseCSV = (csvText) => {
        const data = {};
        const lines = csvText.split(/\r\n|\n/);
        const unquote = (str) => str.replace(/^"|"$/g, '');
        const hasLetters = (str) => /[a-zA-Zァ-ヶーｦ-ﾟ]/.test(str);

        lines.forEach((line, index) => {
            const trimmedLine = line.trim();
            if (trimmedLine === '') return;
            
            const parts = trimmedLine.split(',');
            if (parts.length < 4) return;
            
            const roomColumn = parts[1] ? unquote(parts[1].trim()) : '';
            const nameColumn = parts[3] ? unquote(parts[3].trim()) : '';
            
            if (index === 0 && isNaN(parseInt(roomColumn, 10))) return;

            if (roomColumn && nameColumn && hasLetters(nameColumn)) {
                if (!data[roomColumn]) {
                    data[roomColumn] = [];
                }
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
        roomRow.innerHTML = `
            <label for="room-${rowId}">Room Number:</label>
            <input type="text" id="room-${rowId}" class="room-number-input" placeholder="e.g., 501">
            <span class="guest-name-display">[Guest Name]</span>
            <button type="button" class="delete-room-btn">X</button>
        `;
        roomEntryContainer.appendChild(roomRow);
        
        const new_input = roomRow.querySelector('.room-number-input');
        new_input.addEventListener('keyup', handleRoomInput);
        new_input.addEventListener('keydown', handleKeydown);
        return new_input;
    };
    
    const handleKeydown = (event) => {
        if (event.key === 'Enter') {
            event.preventDefault();
            const new_input = addRoomRow();
            new_input.focus();
        }
    };

    const handleRoomInput = (event) => {
        const input = event.target;
        const roomNumber = input.value.trim();
        const nameDisplay = input.closest('.room-row').querySelector('.guest-name-display');
        
        const names = guestData[roomNumber];
        
        if (names && names.length > 0) {
            nameDisplay.textContent = names.join(', ');
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
            const guestNames = guestData[roomNumber];

            if (guestNames && guestNames.length > 0) {
                lettersGenerated++;
                const combinedGuestName = guestNames.join(', ');
                const language = isJapaneseName(combinedGuestName) ? 'ja' : 'en';
                
                let formattedGuestName;
                if (language === 'ja') {
                    formattedGuestName = combinedGuestName + ' 様';
                } else {
                    formattedGuestName = 'Mr./Ms. ' + combinedGuestName;
                }
                
                // UPDATED: Now handles both English-to-Japanese AND Japanese-to-English translation
                let finalClerkName = clerkName;
                if (language === 'ja') {
                    // Find the Japanese name for the entered English name
                    const translatedName = staffNameTranslations[clerkName.toUpperCase()];
                    if (translatedName) {
                        finalClerkName = translatedName;
                    }
                } else if (language === 'en') {
                    // Find the English name for the entered Japanese name
                    const translatedName = japaneseToEnglish[clerkName];
                    if (translatedName) {
                        finalClerkName = translatedName;
                    }
                }

                const content = letterContent[language];
                const labels = letterLabels[language];
                const letterClone = letterTemplate.content.cloneNode(true);

                letterClone.querySelectorAll('.title').forEach(el => el.innerHTML = content.title);
                letterClone.querySelectorAll('.data-room-number').forEach(el => el.textContent = roomNumber);
                letterClone.querySelectorAll('.data-guest-name').forEach(el => el.textContent = formattedGuestName);
                letterClone.querySelectorAll('.letter-body').forEach(el => el.innerHTML = content.body);
                letterClone.querySelectorAll('.data-date').forEach(el => el.textContent = today);
                letterClone.querySelectorAll('.data-clerk-name').forEach(el => el.textContent = finalClerkName);
                
                letterClone.querySelectorAll('.label-room-no').forEach(el => el.textContent = labels.roomNo);
                letterClone.querySelectorAll('.label-guest-name').forEach(el => el.textContent = labels.guestName);
                letterClone.querySelectorAll('.label-clerk').forEach(el => el.textContent = labels.clerk);
                letterClone.querySelectorAll('.label-date').forEach(el => el.textContent = labels.date);
                
                letterClone.querySelector('.front-desk-copy .copy-indicator').textContent = labels.frontDeskCopy;

                printArea.appendChild(letterClone);
            }
        });
        
        if (lettersGenerated > 0) {
            setTimeout(() => {
                window.print();
            }, 100);
        } else {
            alert('No valid room numbers were entered. Please enter at least one valid room number from the list.');
        }
    };

    roomEntryContainer.addEventListener('click', function(event) {
        if (event.target.classList.contains('delete-room-btn')) {
            const rowToRemove = event.target.closest('.room-row');
            if (rowToRemove) {
                rowToRemove.remove();
            }
        }
    });

    csvUploadInput.addEventListener('change', handleFileUpload);
    addRoomBtn.addEventListener('click', addRoomRow);
    generateBtn.addEventListener('click', generateLetters);
});
