
const getImageInfo = url => {

    let start = false;
    let context = null;
    let c = document.createElement("canvas");
    let count = 0;

    if (c.getContext) {
        context = c.getContext("2d");
        if (context.getImageData) {
            start = true;
        }
    }

    return new Promise((resolve, reject) => {
        if (start) {
            let loadImage = new Image();
            loadImage.style.position = "absolute";
            loadImage.style.left = "-10000px";
            document.body.appendChild(loadImage);

            loadImage.onload = function () {
                c.width = this.width;
                c.height = this.height;
                c.style.width = this.width + "px";
                c.style.height = this.height + "px";
                context.drawImage(this, 0, 0, this.width, this.height);
                try {
                    try {
                        var imgDat = context.getImageData(0, 0, this.width, this.height);
                    } catch (e) {
                        netscape.security.PrivilegeManager.enablePrivilege("UniversalBrowserRead");
                        var imgDat = context.getImageData(0, 0, this.width, this.height);
                    }
                } catch (e) {
                    throw new Error("unable to access image data: " + e);
                }
                let imgData = imgDat.data;
                for (let i = 0; i < imgData.length; i += 4) {
                    let row = Math.floor((i / 4) / this.width);
                    let col = (i / 4) - (row * this.width);
                    if ((imgData[i] + imgData[i + 1] + imgData[i + 2]) < 30 && imgData[i + 3] > 0) {
                        count++;
                    }
                }
                document.body.removeChild(loadImage);
                resolve({
                    image: this,
                    density: (count / (this.width * this.height)),
                    width: this.width,
                    height: this.height
                });
            };
            loadImage.src = url;
        } else {
            reject();
        }
    });

}

const applyStyles = (element, type) => {

    const styles = {
        'parent': {
            display: 'flex',
            width: '100%',
            justifyContent: 'center',
            flexWrap: 'wrap',
            width: '100%'
        },
        'child': {
            alignSelf: 'center',
            position: 'initial',
            left: 'unset'
        }
    }

    for (let prop in styles[type]) element.style[prop] = styles[type][prop]

}

const logayaut = (logos, container, userConfig) => {

    if (logos.length === 0) {
        console.error('logayaut: array of logos is empty');
        return;
    }
    
    const logoCount = logos.length;
    const defaultConfig = {
        area: 5000,
        densityShrinkFactor: .8,
        padding: '20px'
    }
    const config = {...defaultConfig, ...userConfig}

    const imgsInfo = {};
    const loaders = [];

    for (let i = 0; i < logoCount; i++) {
        loaders.push(getImageInfo(logos[i]).then((data) => {
            let oldHeight = data.height / 2;
            let oldWidth = data.width / 2;
            data.newWidth = Math.sqrt((config.area * oldWidth) / oldHeight); 
            data.newWidth *= Math.min(1, 2 - config.densityShrinkFactor - data.density); 
            imgsInfo[i] = data;
        }));
    }

    Promise.all(loaders).then(() => {
        const logayaut_container = document.createElement('div');
        applyStyles(logayaut_container, 'parent');

        for (let i = 0; i < logoCount; i++) {
            let image = imgsInfo[i].image;
            image.style.width = `${imgsInfo[i].newWidth}px`;
            image.style.padding = config.padding;
            applyStyles(image, 'child');
            logayaut_container.appendChild(image);
        }

        container.appendChild(logayaut_container);
    });
}

module.exports = logayaut