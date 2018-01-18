$(document).ready(function() {
    var log = $('.changelog ul');
    $('.changelog h1').click(function(ev) { 
        $('.changelog').toggleClass('open');
        log.slideToggle({ duration: 50 });
    });
    $.ajax({
        method: 'get',
        url: 'changelog.json',
        dataType: 'json',
        success: function(data) {
            var log = $('.changelog ul');
            log.empty();
            data.sort(function(a,b) {
                var v_a = a.version.split('.');
                var v_b = b.version.split('.');
                for (i = 0; i < v_a.length; i++) {
                    if (v_a[i] > v_b[i]) return 1;
                    if (v_a[i] < v_b[i]) return -1;
                }
                return 0;
            });
            console.log(data);
            data.forEach(function(elt) {
                item = $('<li>');
                item.html('<strong>Version ' + elt.version + ', ' + elt.date + '</strong> - ' + elt.description);
                log.prepend(item);
                console.log(elt);
            });
        }
    });
});
