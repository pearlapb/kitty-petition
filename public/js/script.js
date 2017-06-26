
(function(){

    document.addEventListener('mousemove', function move(e) {
        var mouseKitty = document.getElementById('mouse-kitty');
        var x = e.clientX;
        var y = e.clientY;
        mouseKitty.style.left =  x + 'px';
        mouseKitty.style.top = y + 'px';
        mouseKitty.style.transform = 'translate(-150%, -50%)';
    });


    $('#menu').on('click', function menuAppear() {
        $('#hamburger, #layer').addClass('show');
        $('#layer, #exit').on('click', function menuDissapear() {
            $('#hamburger, #layer').removeClass('show');
        });
    });

    var canvas = document.getElementById('canv');
    var ctx = canvas.getContext('2d');
    var hiddenField = $('#hidden-field');

    var dataURL;
    var rect = canvas.getBoundingClientRect();
    var mouseX, mouseY;

    $('#clear').on('click', function() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
    });

    $('#canv').on('mousedown', function(e) {
        mouseX = e.pageX - this.offsetLeft;
        mouseY = e.pageY - this.offsetTop;
        canvas.addEventListener('mousemove',onMouseMove);
        document.body.addEventListener('mouseup', onMouseUp);
    });

    function onMouseMove(e) {
        var gradient = ctx.createLinearGradient(0,0,400,150);
        gradient.addColorStop('0', '#E98000');
        gradient.addColorStop('1', '#EB6E80');
        ctx.strokeStyle = gradient;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(mouseX, mouseY);
        mouseX = e.clientX - rect.left;
        mouseY = e.clientY - rect.top;
        ctx.lineTo(mouseX, mouseY);
        ctx.closePath();
        ctx.stroke();
    }

    function onMouseUp() {
        dataURL = canvas.toDataURL();
        hiddenField.val(dataURL);
        canvas.removeEventListener('mousemove', onMouseMove);
        document.body.removeEventListener('mouseup', onMouseUp);
    }


})();
