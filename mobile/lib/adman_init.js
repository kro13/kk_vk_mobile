(function(window) {
    'use strict';

    window.admanInit = function(opts, onReady, onNoAds) {
        if (!window.AdmanHTML) {
            if (onNoAds) onNoAds();
            return;
        }

        var params = {
            vk_id: opts.user_id,
            content_id: opts.app_id,
            type_load: opts.type == 'rewarded' ? 2 : 1,
            rewarded: opts.type == 'rewarded' ? 1 : 0
        };
        if (opts.params) {
            for (var key in opts.params) {
                if (opts.params.hasOwnProperty(key) &&  opts.params[key] != null) {
                    params[key] = opts.params[key];
                }
            }
        }

        var wrapperEl     = elFromHtml(htmlTemplate);
        var videoEl       = wrapperEl.querySelector('.adman_video');
        var timerRemained = wrapperEl.querySelector('.adman_timer_remained');
        var buttonSkip    = wrapperEl.querySelector('.adman_button_skip');
        var buttonPlay    = wrapperEl.querySelector('.adman_button_play');
        var buttonMute    = wrapperEl.querySelector('.adman_button_mute');

        if (opts.mobile) {
            var contentEl = wrapperEl.querySelector('.adman_content');
            contentEl.classList.add('adman_content_fluid');
        }

        wrapperEl.appendChild(elFromHtml(stylesTemplate));

        var adman = new AdmanHTML();

        adman.setDebug(!!opts.debug);

        adman.init({
            slot: opts.mobile ? 337682 : 2060,
            wrapper: wrapperEl,
            videoEl: videoEl,
            videoQuality: 360,
            params: params,
            browser: browser,
            config: config
        });

        // adman doesnt support multiple callbacks listening for same event so we need a kostyl here
        var clientCallbacks = {};
        var admanCallback = function(callbackName, callback) {
            adman[callbackName](function() {
                callback.apply(null, arguments);
                if (clientCallbacks[callbackName]) clientCallbacks[callbackName].apply(null, arguments);
            });
            adman[callbackName] = function(clientCallback) {
                clientCallbacks[callbackName] = clientCallback;
            };
        };

        var admanStart = adman.start;
        adman.start = function() {
            document.body.appendChild(wrapperEl);
            videoEl.controls = false;
            videoEl.onvolumechange = onVolumeChange;
            buttonSkip.onclick = onClickSkip;
            buttonPlay.onclick = onClickPause;
            buttonMute.onclick = onClickMute;
            onVolumeChange();
            admanStart.apply(adman, arguments);
        };

        admanCallback('onReady', function() {
            var banners = adman.getBannersForSection('preroll');
            var hasVideoBanners = banners.some(function(banner) {
                return banner.type && banner.type !== 'statistics';
            });
            if (hasVideoBanners) {
                if (onReady) onReady(adman);
            } else {
                adman.destroy();
                if (onNoAds) onNoAds();
            }
        });

        var currentBanner;

        admanCallback('onStarted', function(section, banner) {
            currentBanner = banner;
        });

        admanCallback('onCompleted', function() {
            currentBanner = null;
            document.body.removeChild(wrapperEl);
            adman.destroy();
        });

        admanCallback('onTimeRemained', function(data) {
            if (!currentBanner || currentBanner.showControls === false) return;
            timerRemained.innerHTML = 'Р РµРєР»Р°РјР° <b>' + Math.round(data.remained) + '</b>';
            if (opts.type != 'rewarded' && currentBanner.allowCloseDelay && currentBanner.allowCloseDelay < data.duration) {
                if (data.currentTime < currentBanner.allowCloseDelay) {
                    buttonSkip.innerHTML = 'РџСЂРѕРїСѓСЃС‚РёС‚СЊ С‡РµСЂРµР· <b>' + Math.round(currentBanner.allowCloseDelay - data.currentTime) + '</b> СЃ';
                } else if (buttonSkip.disabled) {
                    buttonSkip.disabled = false;
                    buttonSkip.innerHTML = 'РџСЂРѕРїСѓСЃС‚РёС‚СЊ';
                }
            }
        });

        admanCallback('onPlayed', function() {
            buttonPlay.dataset.playing = true;
            videoEl.controls = false;
        });

        admanCallback('onPaused', function() {
            delete buttonPlay.dataset.playing;
        });

        function onClickSkip() {
            if (!buttonSkip.disabled) {
                adman.skip();
            }
        }

        function onClickMute() {
            var unmute = !!buttonMute.dataset.muted;
            adman.setVolume(unmute ? 1 : 0);
            videoEl.muted = !unmute;
            changeMuteState(!unmute);
        }

        function onClickPause() {
            if (buttonPlay.dataset.playing) {
                adman.pause();
            } else {
                adman.resume();
            }
        }

        function onVolumeChange() {
            var muted = videoEl.muted || !videoEl.volume;
            changeMuteState(muted);
        }

        function changeMuteState(muted) {
            if (muted) {
                buttonMute.dataset.muted = 'muted';
            } else {
                delete buttonMute.dataset.muted;
            }
        }

        return adman;
    };

    console.log("adman init1");

    var browser = {
        mobile: /iPhone|iPad|iPod|Android/i.test(navigator.userAgent),
        FLASH_BLOCKED: 0,
        FLASH_READY: 1,
        FLASH_UNKNOWN: 2,
        checkFlashStatus: function(callback) {
            callback(browser.FLASH_UNKNOWN);
        }
    };

    var config = {
        vpaidJsInterface: 'https://ad.mail.ru/static/vpaid-js-interface.swf'
    };

    var htmlTemplate =
        '<div class="adman_layer">\
          <div class="adman_content">\
            <video class="adman_video" playsinline></video>\
            <div class="adman_controls">\
              <span class="adman_timer_remained"></span>\
              <button class="adman_button_skip" disabled></button>\
              <button class="adman_button_play"></button>\
              <button class="adman_button_mute"></button>\
            </div>\
          </div>\
        </div>'
    ;

    var stylesTemplate =
        '<style>\
          .adman_layer {\
            position: fixed;\
            z-index: 9999;\
            top: 0;\
            right: 0;\
            bottom: 0;\
            left: 0;\
            background: rgba(0, 0, 0, .8);\
          }\
          .adman_content {\
            position: absolute;\
            top: 0;\
            right: 0;\
            bottom: 0;\
            left: 0;\
            width: 640px;\
            height: 360px;\
            margin: auto;\
          }\
          .adman_content_fluid {\
            width: 100%;\
            height: 100%;\
          }\
          .adman_video {\
            position: absolute;\
            left: 0;\
            top: 0;\
            width: 100%;\
            height: 100%;\
          }\
          .adman_timer_remained, .adman_button_skip, .adman_button_mute, .adman_button_play {\
            position: absolute;\
            padding: 0 20px;\
            border-radius: 3px;\
            border: none;\
            outline: 0;\
            height: 37px;\
            background: rgba(0, 0, 0, .6);\
            color: #fff;\
            font: 13px/37px sans-serif;\
            cursor: default;\
          }\
          .adman_timer_remained {\
            left: 10px;\
            top: 10px;\
          }\
          .adman_button_skip {\
            right: 10px;\
            top: 10px;\
          }\
          .adman_timer_remained:empty,\
          .adman_button_skip:empty {\
            display: none;\
          }\
          .adman_button_play, .adman_button_mute {\
            width: 37px;\
            background-repeat: no-repeat;\
            background-position: 50%;\
          }\
          .adman_button_play {\
            left: 10px;\
            bottom: 10px;\
            background-image: url(data:image/svg+xml;charset=utf-8,%3Csvg%20width%3D%2221%22%20height%3D%2218%22%20viewBox%3D%22176%20567%2021%2018%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Cpath%20d%3D%22M181.676%20584.73c-.925.603-1.676.196-1.676-.9v-15.662c0-1.1.744-1.5%201.662-.896l11.67%207.693c.92.605.92%201.58-.013%202.187l-11.644%207.578z%22%20fill%3D%22%23FFF%22%2F%3E%3C%2Fsvg%3E);\
          }\
          .adman_button_play[data-playing] {\
            background-image: url(data:image/svg+xml;charset=utf-8,%3Csvg%20width%3D%2221%22%20height%3D%2218%22%20viewBox%3D%22177%20567%2021%2018%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Cpath%20d%3D%22M180%20567.993c0-.548.444-.993%201-.993h3c.552%200%201%20.445%201%20.993v16.014c0%20.548-.444.993-1%20.993h-3c-.552%200-1-.445-1-.993v-16.014zm9%200c0-.548.444-.993%201-.993h3c.552%200%201%20.445%201%20.993v16.014c0%20.548-.444.993-1%20.993h-3c-.552%200-1-.445-1-.993v-16.014z%22%20fill%3D%22%23FFF%22%2F%3E%3C%2Fsvg%3E);\
          }\
          .adman_button_mute {\
            right: 10px;\
            bottom: 10px;\
            background-image: url(data:image/svg+xml;charset=utf-8,%3Csvg%20width%3D%2219%22%20height%3D%2216%22%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%20viewBox%3D%22822%20568%2019%2016%22%3E%3Cpath%20d%3D%22M832.98%20582.823c-.03%201.207-.67%201.61-1.828.62-1.72-1.47-3.61-3.194-4.242-3.72-.632-.53-1.645-.622-3.073-.622-1.427%200-1.815-.62-1.815-1.24s-.014-1.828-.014-2c0-.055.005-.086.014-.13.02-.095-.058-.973%200-1.59.085-.906.388-1.24%201.815-1.24%201.428%200%202.44-.093%203.073-.622.633-.528%202.523-2.252%204.242-3.72%201.158-.99%201.797-.588%201.83.62.042%201.606%200%203.85%200%206.682%200%202.83.042%205.356%200%206.963z%22%20fill%3D%22%23FFF%22%3E%3C/path%3E%3Cpath%20d%3D%22M835.138%20578.866c.185.182.486.177.67-.006.737-.737%201.192-1.746%201.192-2.86%200-1.115-.454-2.123-1.19-2.86-.183-.184-.484-.188-.67-.006-.182.18-.185.473-.004.653.57.57.923%201.35.923%202.212%200%20.863-.354%201.643-.926%202.213-.18.18-.178.473.004.653%22%20fill%3D%22%23FFF%22%20class%3D%22_wave1%22%3E%3C/path%3E%3Cpath%20d%3D%22M837.162%20580.846c.214.207.562.205.775-.004C839.21%20579.596%20840%20577.888%20840%20576c0-1.888-.788-3.596-2.06-4.842-.222-.218-.59-.21-.802.023-.193.215-.166.538.038.74%201.066%201.054%201.723%202.49%201.723%204.08%200%201.6-.67%203.048-1.75%204.104-.207.202-.197.54.012.742%22%20fill%3D%22%23FFF%22%20class%3D%22_wave2%22%3E%3C/path%3E%3C/svg%3E);\
          }\
          .adman_button_mute[data-muted] {\
            background-image: url(data:image/svg+xml;charset=utf-8,%3Csvg%20width%3D%2219%22%20height%3D%2216%22%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%20viewBox%3D%22822%20568%2019%2016%22%3E%3Cpath%20d%3D%22M832.98%20582.823c-.03%201.207-.67%201.61-1.828.62-1.72-1.47-3.61-3.194-4.242-3.72-.632-.53-1.645-.622-3.073-.622-1.427%200-1.815-.62-1.815-1.24s-.014-1.828-.014-2c0-.055.005-.086.014-.13.02-.095-.058-.973%200-1.59.085-.906.388-1.24%201.815-1.24%201.428%200%202.44-.093%203.073-.622.633-.528%202.523-2.252%204.242-3.72%201.158-.99%201.797-.588%201.83.62.042%201.606%200%203.85%200%206.682%200%202.83.042%205.356%200%206.963z%22%20fill%3D%22%23FFF%22%3E%3C/path%3E%3Cpath%20d%3D%22M839%20576l1.64%201.64c.205.205.203.517.01.71l-.3.3c-.194.194-.51.19-.71-.01L838%20577l-1.64%201.64c-.2.2-.516.204-.71.01l-.3-.3c-.193-.193-.195-.505.01-.71L837%20576l-1.64-1.64c-.205-.205-.203-.517-.01-.71l.3-.3c.194-.194.51-.19.71.01L838%20575l1.64-1.64c.2-.2.516-.204.71-.01l.3.3c.193.193.195.505-.01.71L839%20576z%22%20fill%3D%22%23FFF%22%20class%3D%22_cross%22%3E%3C/path%3E%3C/svg%3E);\
          }\
          .adman_button_skip:not(:disabled), .adman_button_play, .adman_button_mute {\
            cursor: pointer;\
          }\
          .adman_button_skip:not(:disabled):hover, .adman_button_play:hover, .adman_button_mute:hover {\
            background-color: rgba(34, 34, 34, .6);\
          }\
        </style>'
    ;

    function elFromHtml(html) {
        var tmp = document.createElement('div');
        tmp.innerHTML = html;
        return tmp.firstChild;
    }
})(window);