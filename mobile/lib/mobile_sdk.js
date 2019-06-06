if (!window.VK) window.VK = {};

VK.test = function(){console.log('VK: mobile_sdk test ok');};

VK.init = function (successCallback, failedCallback, ver, query) {
    VK._callbacks = {};
    var success = VK.initQueryParams(query);

    VK._bridge = false;
    if (success) {
        if (window.AndroidBridge !== undefined) {
            VK._bridge = window.AndroidBridge;
        }

        if (window.webkit && window.webkit.messageHandlers) {
            VK._bridge = window.webkit.messageHandlers;

            VK._bridge.callMethod = function(functionName, args) {
                this[functionName].postMessage(args);
            };

            VK._bridge.apiCall = function(method, query, callbackId) {
                this.callMethod('VKWebAppApiCall', {
                    method: method,
                    query: query,
                    callbackId: callbackId.toString()
                });
            }
        }
    }
    if (ver) {
        VK._v = ver;
    } else {
        VK._v = false;
    }
    VK._apiCallbacks = {};

    if (success) {
        if (VK.isFunc(successCallback)) {
            successCallback();
        }
    } else {
        if (VK.isFunc(failedCallback)) {
            failedCallback();
        }
    }
};

VK.initQueryParams = function (queryStr) {
    var params = {};
    var query = '';
    if (queryStr) {
        query = queryStr;
    } else {
        query = location.search;
    }
    if (!query.length) {
        return false;
    }
    var qIndex = query.indexOf('?');
    if (qIndex >= 0) {
        query = query.substr(qIndex + 1);
    }
    var locationHashParams = query.split('&');
    var i, param, paramName, paramValue;
    for (i = 0; i < locationHashParams.length; i++) {
        param = locationHashParams[i].split('=');
        paramName = decodeURIComponent(param[0]);
        paramValue = param[1] === null ? null : decodeURIComponent(param[1]);
        params[paramName] = paramValue;
    }
    VK.queryParams = params;
    return true;
};

VK.callMethod = function () {
    var function_name = arguments[0];
    var args = Array.prototype.slice.call(arguments, 1, arguments.length);
    if (this.funcs[function_name] === undefined || this.funcs[function_name]['request'] === undefined) {
        throw new Error('Method ' + function_name + ' is undefined or invalid');
    }
    this.funcs[function_name]['request'].apply(this, args);
};

VK.api = function () {
    var args = Array.prototype.slice.call(arguments);
    var method = args.shift();
    var callback = args.pop();
    if (!VK.isFunc(callback)) {
        callback = false;
    }
    if (!args[0]) {
        args[0] = {};
    }
    if (!args[0]['v'] && VK._v) {
        args[0]['v'] = VK._v;
    }
    VK.proxy.apiCall(method, args[0], callback);
};

VK.addCallback = function (eventName, callback) {
    if (callback) {
        VK._callbacks[eventName] = callback;
    }
};
VK.removeCallback = function (eventName) {
    if (VK._callbacks[eventName]) {
        delete VK._callbacks[eventName];
    }
};
VK.close = function () {
    VK.proxy.call('close');
};
VK.isFunc = function (func) {
    return typeof func === 'function';
};
VK.runCallback = function () {
    var eventName;
    eventName = arguments[0];
    var args = Array.prototype.slice.call(arguments, 1, arguments.length);
    if (VK.isFunc(VK._callbacks[eventName])) VK._callbacks[eventName].apply(VK, args);
};

VK.funcs = {
    showSettingsBox: {
        request: function (mask) {
            if (mask < 0) {
                throw  new Error('Mask must be more 0');
            }
            var params = {
                mask: mask,
                access_token: VK.queryParams.access_token
            };
            this.proxy.call('showSettingsBox', params);
        },
        response: function (status, access_token) {
            if (status === 'success' && access_token) {
                VK.queryParams["access_token"] = access_token;
            }
            VK.runCallback('onSettingsBoxDone', status, access_token);
        }
    },
    showInviteBox: {
        request: function () {
            this.proxy.call('showInviteBox', {});
        },
        response: function (status) {
            VK.runCallback('onInviteBoxDone', status);
        }
    },
    showOrderBox: {
        request: function (paramsUnchecked) {
            if (typeof paramsUnchecked !== 'object') {
                throw new Error('Order box params must be object');
            }
            if (typeof paramsUnchecked.type === undefined) {
                throw new Error('Order box param type must be string');
            }
            var params = {};
            if (paramsUnchecked.type === 'votes') {
                if (typeof paramsUnchecked.votes !== 'number') {
                    throw new Error('Order box param votes must be int');
                }
                params.type = 'votes';
                params.votes = paramsUnchecked.votes;
            } else if (paramsUnchecked.type === 'item') {
                if (typeof paramsUnchecked.item !== 'string') {
                    throw new Error('Order box param item must be string');
                }
                params.type = 'item';
                params.item = paramsUnchecked.item;
            } else {
                throw new Error('Order box param type with invalid value');
            }
            this.proxy.call('showOrderBox', params);
        },
        response: function (status) {
            VK.runCallback('onOrderBoxDone', status);
        }
    },
    showRequestBox: {
        request: function (uid, message, requestKey) {
            if (uid <= 0) {
                throw new Error('UID must be more 0');
            }
            var params = {
                uid: uid,
                message: message,
                requestKey: requestKey
            };
            this.proxy.call('showRequestBox', params);
        },
        response: function (status, request_id) {
            VK.runCallback('onRequestBoxDone', status, request_id);
        }
    },
    showShareBox: {
        request: function (message, attachments, target) {
            if (!target) {
                target = 'wall';
            }
            var params = {
                message: message,
                attachments: attachments,
                target: target
            };
            this.proxy.call('showShareBox', params);
        },
        response: function (status) {
            VK.runCallback('onShareBoxDone', status);
        }
    },
    showLeaderboardBox: {
        request: function (user_result) {
            var params = {
                user_result: user_result
            };
            this.proxy.call('showLeaderboardBox', params);
        },
        response: function (status) {
            VK.runCallback('onLeaderboardBoxDone', status);
        }
    },
    addToMenu: {
        request: function() {
            this.proxy.call('addToMenu');
        },
        response: function(status) {
            VK.runCallback('onAddToMenuDone', status);
        }
    },
    showAllowMessagesFromCommunityBox: {
        request: function(groupId) {
            var params = { groupId: groupId };
            this.proxy.call('showAllowMessagesFromCommunityBox', params)
        },
        response: function(response) {
            if (response === 'success') {
                VK.runCallback('onAllowMessagesFromCommunity');
            } else {
                VK.runCallback('onAllowMessagesFromCommunityCancel')
            }
        }
    }
};

VK.proxy = {
    buildQuery: function(args, withQuestion) {
        if (typeof args === 'object') {
            var req = [];
            for (var arg in args) {
                var argVal = '';
                if (args[arg] !== undefined) {
                    argVal = encodeURIComponent(args[arg]);
                }
                req.push(encodeURIComponent(arg) + '=' + argVal);
            }
            query = req.join('&');
            if (withQuestion) {
                query = '?' + query;
            }
        } else if (args === undefined) {
            query = '';
        } else {
            return false;
        }
        return query;
    },
    generateUrl: function (function_name, args) {
        var url = "vk://" + function_name;
        var query = VK.proxy.buildQuery(args, true);
        if (query === false) {
            return false;
        }
        return url + query;
    },
    bridgeExecuteFunction: function (functionName, args) {
        var query = VK.proxy.buildQuery(args, false);
        if (query === false) {
            return false;
        }
        VK._bridge.callMethod(functionName, query);
    },
    call: function (function_name, args) {
        if (VK._bridge) {
            VK.proxy.bridgeExecuteFunction(function_name, args)
        } else {
            var url = VK.proxy.generateUrl(function_name, args);
            if (!url.match(/^vk:\/\/./)) {
                return false;
            }
            location.href = url;
        }

        return true;
    },
    apiCall: function (method, args, callback) {
        if (VK._bridge) {
            var callbackId = new Date().getUTCMilliseconds();
            VK._apiCallbacks[callbackId] = callback;
            args.access_token = VK.queryParams.access_token;
            var query = VK.proxy.buildQuery(args, false);
            if (query === false) {
                return false;
            }
            VK._bridge.apiCall(method, query, callbackId);
        } else {
            throw new Error('Call VK.api is not possible');
        }
    },
    apiResponse: function (callbackId, response) {
        if (VK._apiCallbacks[callbackId] && VK.isFunc(VK._apiCallbacks[callbackId])) {
            VK._apiCallbacks[callbackId](response);
        }
    },
    response: function () {
        var function_name = arguments[0];
        var args = Array.prototype.slice.call(arguments, 1, arguments.length);
        if (VK.funcs[function_name] === undefined || VK.funcs[function_name]['response'] === undefined) {
            throw new Error('Method ' + function_name + ' is undefined or invalid');
        }
        VK.funcs[function_name]['response'].apply(this, args);
    }
};