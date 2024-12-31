        const imageContainer = document.getElementById('imageContainer');
        const addImageBtn = document.getElementById('addImageBtn');
        const gapInput = document.getElementById('gapInput');
        const toggleOrientationBtn = document.getElementById('toggleOrientation');
        const closeBtn = document.getElementById('closeBtn');
        const downloadBtn = document.getElementById('downloadBtn');
        const previewCanvas = document.getElementById('previewCanvas');
        const emptyState = document.getElementById('emptyState');
        const ctx = previewCanvas.getContext('2d');

        let isHorizontal = true;
        let imageCount = 0;
        let draggedElement = null;

        function createImageBox() {
            const imageBox = document.createElement('div');
            imageBox.className = 'image-box';
            imageBox.draggable = true;
            imageBox.id = `box${++imageCount}`;

            const uploadZone = document.createElement('div');
            uploadZone.className = 'upload-zone';
            uploadZone.innerHTML = `
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12"/>
                </svg>
                <span>Click to upload</span>
            `;

            const img = document.createElement('img');
            img.id = `img${imageCount}`;
            img.alt = `Image ${imageCount}`;
            img.style.display = 'none';
            img.onload = function() {
                this.style.display = 'block';
                uploadZone.style.display = 'none';
                updatePreview();
            };

            const fileInput = document.createElement('input');
            fileInput.type = 'file';
            fileInput.id = `file${imageCount}`;
            fileInput.accept = 'image/*';
            fileInput.style.display = 'none';

            const removeBtn = document.createElement('button');
            removeBtn.className = 'remove-image';
            removeBtn.innerHTML = '&times;';
            removeBtn.title = 'Remove image';
            removeBtn.style.display = 'none';
            removeBtn.onclick = (e) => {
                e.stopPropagation();
                removeImage(imageBox);
            };

            uploadZone.onclick = () => fileInput.click();
            
            fileInput.onchange = (e) => {
                const file = e.target.files[0];
                if (file) {
                    const reader = new FileReader();
                    reader.onload = (e) => {
                        img.src = e.target.result;
                        removeBtn.style.display = 'flex';
                    };
                    reader.readAsDataURL(file);
                }
            };

            imageBox.appendChild(uploadZone);
            imageBox.appendChild(img);
            imageBox.appendChild(fileInput);
            imageBox.appendChild(removeBtn);

            setupDragAndDrop(imageBox);

            return imageBox;
        }

        function removeImage(imageBox) {
            imageContainer.removeChild(imageBox);
            updatePreview();
        }

        function setupDragAndDrop(element) {
            element.addEventListener('dragstart', handleDragStart);
            element.addEventListener('dragend', handleDragEnd);
            element.addEventListener('dragover', handleDragOver);
            element.addEventListener('drop', handleDrop);
            element.addEventListener('dragenter', handleDragEnter);
            element.addEventListener('dragleave', handleDragLeave);
        }

        function handleDragStart(e) {
            draggedElement = this;
            this.classList.add('dragging');
            e.dataTransfer.effectAllowed = 'move';
            e.dataTransfer.setData('text/plain', '');
        }

        function handleDragEnd(e) {
            this.classList.remove('dragging');
            draggedElement = null;
            document.querySelectorAll('.image-box').forEach(box => {
                box.classList.remove('placeholder');
            });
            updatePreview();
        }

        function handleDragOver(e) {
            e.preventDefault();
            e.dataTransfer.dropEffect = 'move';
        }

        function handleDragEnter(e) {
            e.preventDefault();
            if (this !== draggedElement) {
                this.classList.add('placeholder');
            }
        }

        function handleDragLeave(e) {
            this.classList.remove('placeholder');
        }

        function handleDrop(e) {
            e.preventDefault();
            this.classList.remove('placeholder');
            
            if (draggedElement && this !== draggedElement) {
                const allBoxes = [...imageContainer.getElementsByClassName('image-box')];
                const draggedPos = allBoxes.indexOf(draggedElement);
                const droppedPos = allBoxes.indexOf(this);

                if (draggedPos < droppedPos) {
                    this.parentNode.insertBefore(draggedElement, this.nextSibling);
                } else {
                    this.parentNode.insertBefore(draggedElement, this);
                }
                updatePreview();
            }
        }

        function updatePreview() {
            const images = Array.from(imageContainer.getElementsByTagName('img'))
                .filter(img => img.src && img.style.display !== 'none');

            if (images.length === 0) {
                previewCanvas.width = 0;
                previewCanvas.height = 0;
                emptyState.style.display = 'block';
                return;
            }

            emptyState.style.display = 'none';
            const gap = parseInt(gapInput.value);
            let totalWidth = 0;
            let totalHeight = 0;
            const maxWidth = 800;
            const imageDetails = [];

            images.forEach(img => {
                const aspectRatio = img.naturalWidth / img.naturalHeight;
                let width, height;

                if (isHorizontal) {
                    height = 200;
                    width = height * aspectRatio;
                } else {
                    width = 200;
                    height = width / aspectRatio;
                }

                imageDetails.push({ width, height });

                if (isHorizontal) {
                    totalWidth += width;
                    totalHeight = Math.max(totalHeight, height);
                } else {
                    totalWidth = Math.max(totalWidth, width);
                    totalHeight += height;
                }
            });

            if (isHorizontal) {
                totalWidth += gap * (images.length - 1);
            } else {
                totalHeight += gap * (images.length - 1);
            }

            const scale = Math.min(1, maxWidth / totalWidth);
            previewCanvas.width = totalWidth * scale;
            previewCanvas.height = totalHeight * scale;

            ctx.fillStyle = 'white';
            ctx.fillRect(0, 0, previewCanvas.width, previewCanvas.height);

            let x = 0;
            let y = 0;

            images.forEach((img, i) => {
                const width = imageDetails[i].width * scale;
                const height = imageDetails[i].height * scale;

                ctx.drawImage(img, x, y, width, height);

                if (isHorizontal) {
                    x += width + (gap * scale);
                } else {
                    y += height + (gap * scale);
                }
            });
        }

        function generateHDImage() {
            const images = Array.from(imageContainer.getElementsByTagName('img'))
                .filter(img => img.src && img.style.display !== 'none');

            if (images.length === 0) return;

            const gap = parseInt(gapInput.value);
            let totalWidth = 0;
            let totalHeight = 0;
            const imageDetails = [];

            images.forEach(img => {
                const aspectRatio = img.naturalWidth / img.naturalHeight;
                let width, height;

                if (isHorizontal) {
                    height = 1080;
                    width = height * aspectRatio;
                } else {
                    width = 1080;
                    height = width / aspectRatio;
                }

                imageDetails.push({ width, height });

                if (isHorizontal) {
                    totalWidth += width;
                    totalHeight = Math.max(totalHeight, height);
                } else {
                    totalWidth = Math.max(totalWidth, width);
                    totalHeight += height;
                }
            });

            if (isHorizontal) {
                totalWidth += gap * (images.length - 1);
            } else {
                totalHeight += gap * (images.length - 1);
            }

            const hdCanvas = document.createElement('canvas');
            hdCanvas.width = totalWidth;
            hdCanvas.height = totalHeight;
            const hdCtx = hdCanvas.getContext('2d');

            hdCtx.fillStyle = 'white';
            hdCtx.fillRect(0, 0, hdCanvas.width, hdCanvas.height);

            let x = 0;
            let y = 0;

            images.forEach((img, i) => {
                const width = imageDetails[i].width;
                const height = imageDetails[i].height;

                hdCtx.drawImage(img, x, y, width, height);

                if (isHorizontal) {
                    x += width + gap;
                } else {
                    y += height + gap;
                }
            });

            const link = document.createElement('a');
            link.download = 'combined-image-hd.png';
            link.href = hdCanvas.toDataURL('image/png');
            link.click();
        }

        // Event Listeners
        addImageBtn.addEventListener('click', () => {
            imageContainer.appendChild(createImageBox());
        });

        gapInput.addEventListener('input', () => {
            document.documentElement.style.setProperty('--gap', `${gapInput.value}px`);
            updatePreview();
        });

        toggleOrientationBtn.addEventListener('click', () => {
            isHorizontal = !isHorizontal;
            imageContainer.style.gridAutoFlow = isHorizontal ? 'row' : 'column';
            updatePreview();
        });

        closeBtn.addEventListener('click', () => {
            if (confirm('Are you sure you want to close the application?')) {
                window.close();
            }
        });

        downloadBtn.addEventListener('click', generateHDImage);

        // Initialize with two image boxes
        imageContainer.appendChild(createImageBox());
        imageContainer.appendChild(createImageBox());