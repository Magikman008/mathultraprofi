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
        const width = image.width;
        if (width > maxWidth) {
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

function isPdf(href) {
    let ext = href.split('.').pop();

    if (ext === "pdf") {
        return true;
    }
    return false;
}

function ajaxLoad(href, isPopState = false) {
    if (checkURL(href) === true) {
        return;
    }

    // if (isPdf(href) === true) {
    //     $('#content').fadeOut(300, function () {
    //         $('#content').html('<object data="' + href + '" type="application/pdf" width="100%" height="600" style="border-radius: 10px"></object>');

    //         bindLinkClickHandler($('#content').find('a'));
    //         $(this).fadeIn(300, minWidth());
    //     });
    //     document.getElementsByClassName("cont")[0].style.padding = '0px';
    //     if (!isPopState) {
    //         window.history.pushState({}, '', href);
    //     }
    //     return;
    // }

    $.ajax({
        xhr: function () {
            var xhr = new window.XMLHttpRequest();
            // прогресс загрузки на сервер
            xhr.upload.addEventListener("progress", function (evt) {
                if (evt.lengthComputable) {
                    var percentComplete = evt.loaded / evt.total;
                    console.log("pivo");
                    console.log(percentComplete);
                }
            }, false);
            // прогресс скачивания с сервера
            xhr.addEventListener("progress", function (evt) {
                if (evt.lengthComputable) {
                    var percentComplete = evt.loaded / evt.total;
                    console.log("pivo");
                    // делать что-то...
                    console.log(percentComplete);
                }
            }, false);
            return xhr;
        },
        url: href,
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
                    minWidth();
                    $(this).fadeIn(300);
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
                location.reload(false);
            }
        }, error: function (jqXHR, textStatus, errorThrown) {
            window.location.href = href;
            location.reload(false);

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

function checkSettings() {
    chrome.storage.sync.get(['enabled'], function (result) {
        if (!result.enabled) {
            chrome.storage.sync.set({
                'font': false,
                'font': "Arial, sans-serif"
            }, function () { });
        }
    });
}

function bindSettings() {
    const fontSwitch = document.getElementById('font');
    chrome.storage.sync.get(['fontToggle', 'font'], function (result) {
        fontSwitch.checked = result.fontToggle;
        document.documentElement.style.setProperty('--font', result.font);
    });

    function toggleFont() {
        if (fontSwitch.checked) {
            chrome.storage.sync.set({
                'fontToggle': true,
                'font': '-apple-system,BlinkMacSystemFont,"Segoe UI Adjusted","Segoe UI","Liberation Sans",sans-serif'
            }, function () {
                document.documentElement.style.setProperty('--font', '-apple-system,BlinkMacSystemFont,"Segoe UI Adjusted","Segoe UI","Liberation Sans",sans-serif');
            });
        } else {
            chrome.storage.sync.set({
                'fontToggle': false,
                'font': "Arial, sans-serif"
            }, function () {
                document.documentElement.style.setProperty('--font', "Arial, sans-serif");
            });
        }
    }
    fontSwitch.addEventListener('change', toggleFont, false);
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

    // if (isPdf(window.location.href) === true) {
    //     return;
    // }

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
            $('#first-course').prepend('<div class="title">Первый курс:</div><div style="padding: 0 10px;" align="center">' + subtopics.eq(0).find('a').eq(0).removeAttr('class').prop('outerHTML') + '<br>' + subtopics.eq(0).find('a').eq(1).removeAttr('class').prop('outerHTML') + '</div>')

            for (let j = 0; j < topics.length; j += 1) {
                $('#first-course .themes').append('<li><p class="deactive">' + topics.eq(j).html() + '</p><ul class="sublist" style="display: none;">');
                subtopics.eq(j + 1).find('a').each(function () {
                    $('#first-course .themes .sublist:last').append('<li>' + $(this).prop('outerHTML') + '</li>');
                });
                $('#first-course .themes').append('</ul></li>');
            }

            $('#second-course').append('<ul class="themes"> </ul>');
            $('#second-course').prepend('<div class="title">Второй курс:</div>')

            for (let j = 0; j < topics2.length; j += 1) {
                $('#second-course .themes').append('<li><p class="deactive">' + topics2.eq(j).html() + '</p><ul class="sublist" style="display: none;">');
                subtopics2.eq(j).find('a').each(function () {
                    $('#second-course .themes .sublist:last').append('<li>' + $(this).prop('outerHTML') + '</li>');
                });
                $('#second-course .themes').append('</ul></li>');
            }

            // бинд ссылок и установки ширины
            bindLinkClickHandler($('a'));
            minWidth();

            let offsets = [];

            // складываем меню
            $('.themes ul:visible').slideUp();
            $('.themes>li').each(function () {
                offsets.push($(this).offset().top);
            });


            // бинд меню, настроек и отправка наверх
            initMenu(offsets);
            bindSettings();
            if (!checkURL(window.location.href)) {
                $("body,html").animate({
                    scrollTop: 0
                }, 1);
            }


            // бинд кнопки вверх
            $(window).scroll(function () {
                if ($(this).scrollTop() > 200) {
                    $('#btnScrollTop').fadeIn();
                } else {
                    $('#btnScrollTop').fadeOut();
                }
            });

            $('#btnScrollTop').click(function () {
                $('html, body').animate({
                    scrollTop: 0
                }, 600);
                return false;
            });

            // бинд настроек
            const popup = document.getElementById('popup');
            document.getElementById('closeBtn').addEventListener('click', () => {
                popup.style.display = 'none';
                popup.style.opacity = '0';
            });
            document.getElementById('settings').addEventListener('click', () => {
                popup.style.display = 'block';
                popup.style.opacity = '1';
            });
        }
    });
});