function checkURL(href) {
    const url = new URL(href, window.location.href);
    const hash = url.hash;

    if (hash && window.location.pathname === url.pathname) {
        let element = document.querySelector('a[name="' + hash.substring(1) + '"]');

        if (element) {
            element.scrollIntoView({ behavior: 'smooth' });
            return true;
        }
    }
    return false;
}

function minWidth() {
    const container = document.querySelector('.cont');
    const images = container.querySelectorAll('img');
    let maxWidth = 0;

    images.forEach(image => {
        const width = image.offsetWidth;
        if (image.offsetWidth > maxWidth) {
            maxWidth = width;
        }
    });

    if (maxWidth < 300) {
        container.style.minWidth = '300px';
    }
    else {
        container.style.minWidth = `${maxWidth}px`;
    }
}

function ajaxLoad(href, isPopState = false) {
    if (checkURL(href) === true) {
        return;
    }

    $.ajax({
        url: "http://mathprofi.ru/" + href,
        type: "GET",
        success: function (response) {
            try {
                let tdElements = $(response).find('td').eq(2);

                if ($(response).find('td').length < 4) {
                    tdElements = $(response).find('td').eq(1);
                }

                let firstChild = tdElements.children().first();
                while (firstChild.is('br')) {
                    firstChild.remove();
                    firstChild = tdElements.children().first();
                }

                let toRemove = tdElements.find('noindex');
                let title = $(response).filter('title').text();
                document.title = title;

                for (let i = 0; i < toRemove.length; i++) {
                    toRemove[i].remove();
                }

                $('#content').fadeOut(300, function () {
                    $('#content').html(tdElements.html());
                    bindLinkClickHandler($('#content').find('a'));
                    $(this).fadeIn(300, minWidth());
                });

                if (!checkURL(href)) {
                    $("body,html").animate({
                        scrollTop: 0
                    }, 600);
                }

                if (!isPopState) {
                    window.history.pushState({}, '', href);
                }
            } catch (error) {
                console.log(error);
                window.location.href = href;
            }
        }, error: function (jqXHR, textStatus, errorThrown) {
            //window.location.href = href;
            console.log("Ошибка загрузки данных: " + textStatus + " " + errorThrown);
        }
    });
}

window.addEventListener("popstate", function (e) {
    $("body,html").animate({
        scrollTop: 0
    }, 600);
    ajaxLoad(location.pathname, true);
}, false)

function initMenu(offsets) {
    $('.themes li p').click(function () {
        let iselemnt = $(this).next();

        if ((iselemnt.is('ul')) && (iselemnt.is(':visible'))) {
            iselemnt.slideUp();
            $(this).removeClass('active');

            return false;
        }

        if ((iselemnt.is('ul')) && (!iselemnt.is(':visible'))) {
            $('.themes p.active').removeClass('active');
            $('.themes ul:visible').slideUp();
            $(this).addClass('active');
            iselemnt.slideDown();
            $('html, body').animate({
                scrollTop: offsets[$('.themes p').index(this)]
            }, 500);
            return false;
        }
    });
}

function bindLinkClickHandler(a) {
    let r = new RegExp('^(?:[a-z+]+:)?//', 'i');
    a.each(function () {
        let href = $(this).attr('href');
        if (href && href.indexOf(document.domain) < 0 && r.test(href)) {
            $(this).attr('target', '_blank');
        } else {
            $(this).attr('target', '');
        }
    });
    a.click(function (event) {
        let href = $(this).attr('href');
        if (location.hostname === this.hostname || !this.hostname.length) {
            ajaxLoad(href, false);
            event.preventDefault();
        }
    });
}

document.addEventListener('DOMContentLoaded', function () {
    $('noindex').each(function () {
        $(this).remove();
    });

    let tds = $("td");
    let temp = tds.eq(2);

    if (tds.length != 4) {
        temp = tds.eq(1);
    }

    let firstChild = temp.children().first();
    while (firstChild.is('br')) {
        firstChild.remove();
        firstChild = temp.children().first();
    }

    temp = temp.html();

    $.ajax({
        url: chrome.runtime.getURL('/body.html'),
        dataType: 'html',
        success: function (response) {
            $('td').eq(1).find('br').replaceWith(' ');
            let topics = $('td').eq(1).find('div:first p.classtopic');
            let subtopics = $('td').eq(1).find('div:first p.classs');
            let topics2 = $('td').eq(1).find('div:eq(1) p.classtopic');
            let subtopics2 = $('td').eq(1).find('div:eq(1) p.classs');

            document.body.innerHTML = response;
            $('.themes ul:visible').slideUp();

            document.getElementById('content').innerHTML = temp;

            $('#first-course').append('<ul class="themes"> </ul>');
            $('#first-course').prepend('<div class="cources">Первый курс:</div><div style="padding: 0 10px;" align="center">' + subtopics.eq(0).find('a').eq(0).removeAttr('class').prop('outerHTML') + '<br>' + subtopics.eq(0).find('a').eq(1).removeAttr('class').prop('outerHTML') + '</div>')

            for (let j = 0; j < topics.length; j += 1) {
                $('#first-course .themes').append('<li><p class="deactive">' + topics.eq(j).html() + '</p><ul class="sublist" style="display: none;">');
                subtopics.eq(j + 1).find('a').each(function () {
                    $('#first-course .themes .sublist:last').append('<li>' + $(this).prop('outerHTML') + '</li>');
                });
                $('#first-course .themes').append('</ul></li>');
            }

            $('#second-course').append('<ul class="themes"> </ul>');
            $('#second-course').prepend('<div class="cources">Второй курс:</div>')

            for (let j = 0; j < topics2.length; j += 1) {
                $('#second-course .themes').append('<li><p class="deactive">' + topics2.eq(j).html() + '</p><ul class="sublist" style="display: none;">');
                subtopics2.eq(j).find('a').each(function () {
                    $('#second-course .themes .sublist:last').append('<li>' + $(this).prop('outerHTML') + '</li>');
                });
                $('#second-course .themes').append('</ul></li>');
            }

            bindLinkClickHandler($('a'));
            minWidth();

            let offsets = [];

            $('.themes ul:visible').slideUp();
            $('.themes>li').each(function () {
                offsets.push($(this).offset().top);
            });

            initMenu(offsets);
            if (checkURL(window.location.href) === false) {
                $("body,html").animate({
                    scrollTop: 0
                }, 1);
            }
        }
    });
});


