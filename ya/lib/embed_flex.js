
(function(window) {
    "use strict";

    let minWidth, file, width, height;

    window.embedFlex = (_file, _minWidth) =>
    {
        minWidth = _minWidth;
        file = _file;

        width = getWidth();
        height = getHeight();

        if (width > 0)
        {
            embed();
        }
        else
        {
            window.addEventListener('resize', embedOnResize);
        }
    };

    function embedOnResize() {
        width = getWidth();
        height = getHeight();
        embed();
        window.removeEventListener('resize', embedOnResize);
    }

    function embed() {
        //lime.embed(file, "content", minWidth, 0);
        lime.embed(file, "content", minWidth, minWidth * height / width);
    }

    function getWidth() {
        if (self.innerWidth) {
            return self.innerWidth;
        }

        if (document.documentElement && document.documentElement.clientWidth) {
            return document.documentElement.clientWidth;
        }

        if (document.body) {
            return document.body.clientWidth;
        }
    }

    function getHeight() {
        if (self.innerHeight) {
            return self.innerHeight;
        }

        if (document.documentElement && document.documentElement.clientHeight) {
            return document.documentElement.clientHeight;
        }

        if (document.body) {
            return document.body.clientHeight;
        }
    }

})(window);

