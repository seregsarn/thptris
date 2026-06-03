document.addEventListener('DOMContentLoaded', async (ev) => {
    var log_block = document.querySelector('.changelog');
    var log_head = document.querySelector('.changelog h1');
    var log = document.querySelector('.changelog ul');
    log_head.addEventListener('click', function(ev) { 
        log_block.classList.toggle('open');
    });
    log.replaceChildren();
    changelog.sort((a,b) => {
        var v_a = a.version.split('.');
        var v_b = b.version.split('.');
        for (i = 0; i < Math.max(v_a.length, v_b.length); i++) {
            if (v_a[i] === undefined) v_a = 0;
            if (v_b[i] === undefined) v_b = 0;
            if (v_a[i] > v_b[i]) return -1;
            if (v_a[i] < v_b[i]) return 1;
        }
        return 0;
    });
    changelog.forEach(function(elt) {
        item = document.createElement('li');
        item.innerHTML = '<strong>Version ' + elt.version + ', ' + elt.date + '</strong> - ' + elt.description;
        log.appendChild(item);
    });
});
