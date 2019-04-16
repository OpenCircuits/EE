export const Images = (function() {
    const images: Map<string, HTMLImageElement> = new Map();

    const loadImages = function(imageNames: Array<string>,
                              onFinish: () => void): void {
        // Load each image
        let index = 0;
        for (let imageName of imageNames) {
            let img = new Image();
            img.onload = function() {
                if (++index === imageNames.length)
                    onFinish();
            };
            img.src = "img/items/" + imageName;
            images.set(imageName, img);
        }
    }

    return {
        GetImage: function(img: string): HTMLImageElement {
            return images.get(img);
        },
        Load: function(onFinishLoading: () => void): void {
            loadImages(
                ["voltagesource.svg", "currentsource.svg",
                 "resistor.svg"], onFinishLoading);
        }
    };
})();
