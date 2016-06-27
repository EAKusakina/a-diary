/**
 * https://github.com/SaneMethod/jquery-ajax-localstorage-cache
 */
; (function($, window){
    /**
     * Generate the cache key under which to store the local data - either the cache key supplied,
     * or one generated from the url, the type and, if present, the data.
     */
	 //Создает ключ кэша для хранения локальных данных - либо предоставленного ключа кэша или генерируемого из url, типа и, если есть, данных
    var genCacheKey = function (options) {
        var url = options.url.replace(/jQuery.*/, '');

        // Strip _={timestamp}, if cache is set to false
        if (options.cache === false) {
            url = url.replace(/([?&])_=[^&]*/, '');
        }

        return options.cacheKey || url + options.type + (options.data || '');
		//CacheKey is the key that will be used to store the response in localStorage. It allow you to delete your cache easily with the localStorage.removeItem() function.
		//Default: URL + TYPE(GET/POST) + DATA
    };

    /**
     * Determine whether we're using localStorage or, if the user has specified something other than a boolean
     * value for options.localCache, whether the value appears to satisfy the plugin's requirements.
     * Otherwise, throw a new TypeError indicating what type of value we expect.
     * @param {boolean|object} storage
     * @returns {boolean|object}
     */
	 /*Определяет, используем ли мы локальное хранилище или, если пользователь указал нечто отличное от логиеского значения:
- значение для options.localCache, появляется ли значение, удовлетворяющее требованиям данного плагина
-В противном случае, бросить новый TypeError, указывающий, какой тип значения мы ожидаем.  
- @param {boolean|object} storage
- @returns {boolean|object} */
	 
    var getStorage = function(storage){
        if (!storage) return false;
        if (storage === true) return window.localStorage;
        if (typeof storage === "object" && 'getItem' in storage &&
            'removeItem' in storage && 'setItem' in storage)
        {
            return storage;
        }
		//localCache должен быть либо логическим значением Или объектом, который реализует интерфейс Storage.
        throw new TypeError("localCache must either be a boolean value, " +
            "or an object which implements the Storage interface.");
    };

    /**
     * Remove the item specified by cacheKey and its attendant meta items from storage.
     * @param {Storage|object} storage
     * @param {string} cacheKey
     */
	 //Удалить элемент, указанный cacheKey и его сопутствующие meta items из хранилища
    var removeFromStorage = function(storage, cacheKey){
        storage.removeItem(cacheKey);
        storage.removeItem(cacheKey + 'cachettl');
        storage.removeItem(cacheKey + 'dataType');
    };

    /**
     * Prefilter for caching ajax calls.
     * See also $.ajaxTransport for the elements that make this compatible (совместимыми) with jQuery Deferred.
     * New parameters available on the ajax call:
     * localCache   : true // required - either a boolean (in which case localStorage is used), or an object
     * implementing the Storage interface, in which case that object is used instead.
     * cacheTTL     : 5,           // optional - cache time in hours, default is 5.
     * cacheKey     : 'post',      // optional - key under which cached string will be stored
	 * CacheKey is the key that will be used to store the response in localStorage. 
	 * It allow you to delete your cache easily with the localStorage.removeItem() function.
	 * Default: URL + TYPE(GET/POST) + DATA
     * isCacheValid : function  // optional - return true for valid, false for invalid
     * @method $.ajaxPrefilter
     * @param options {Object} Options for the ajax call, modified with ajax standard settings
     */
    $.ajaxPrefilter(function(options){
        var storage = getStorage(options.localCache), //получили window.localStorage
            hourstl = options.cacheTTL || 5, //время в течение которого данные валидны (по умолчанию - 5 часов)
            cacheKey = genCacheKey(options), //ключ для хранимой информации (cacheKey или URL + TYPE(GET/POST) + DATA)
            cacheValid = options.isCacheValid, //возвращает true если cache валидный, иначе false
            ttl,
            value;
		
		//если хранилище не найдено
        if (!storage) return;
		//получили из хранилища срок хранения данных с ключом cacheKey(в часах)
        ttl = storage.getItem(cacheKey + 'cachettl');
		
		//если есть cacheValid и это функция и она вернула false
        if (cacheValid && typeof cacheValid === 'function' && !cacheValid()){
            //удалим из хранилища данные
			removeFromStorage(storage, cacheKey);
            ttl = 0;
        }
		//если данные в хранилище устарели
        if (ttl && ttl < +new Date()){
            //удалим из хранилища данные
            removeFromStorage(storage, cacheKey);
            ttl = 0;
        }
		
		//получили из хранилища данные по ключу cacheKey
        value = storage.getItem(cacheKey);
		//если данных в хранилище нет
        if (!value){
            // If it not in the cache, we store the data, add success callback - normal callback will proceed (продолжен)
            if (options.success) {
                options.realsuccess = options.success;
            }
            options.success = function(data, status, jqXHR) {
                //ответ сервера
				var strdata = data,
				//тип данных ответа сервера
                    dataType = this.dataType || jqXHR.getResponseHeader('Content-Type');

                //если тип данных - json
				if (dataType.toLowerCase().indexOf('json') !== -1) 
					strdata = JSON.stringify(data);

                // Save the data to storage catching exceptions (possibly QUOTA_EXCEEDED_ERR (когда хранилище переполнено??))
                try {
					//сохранение данных в хранилище
                    storage.setItem(cacheKey, strdata);
                    //сохранение временной метки и типа данных
                    storage.setItem(cacheKey + 'cachettl', +new Date() + 1000 * 60 * 60 * hourstl);
                    storage.setItem(cacheKey + 'dataType', dataType);
                } catch (e) {
					//удаляем любые неполные данные, которые могли быть сохранены до перехвата исключения
                    // Remove any incomplete data that may have been saved before the exception was caught
                    removeFromStorage(storage, cacheKey);
                    console.log('Cache Error:'+e, cacheKey, strdata);
                }

                if (options.realsuccess) options.realsuccess(data, status, jqXHR);
            };
        }
    });

    /**
     * This function performs the fetch from cache portion of the functionality needed to cache ajax
     * calls and still fulfill the jqXHR Deferred Promise interface.
     * See also $.ajaxPrefilter
     * @method $.ajaxTransport
     * @params options {Object} Options for the ajax call, modified with ajax standard settings
     */
	 //Эта функция выполняет выборку из кэша части функциональности, необходимой для кэширования Ajax вызовов и по-прежнему выполняет jqXHR Deffered Promise interface.
    $.ajaxTransport("+*", function(options){
        if (options.localCache)
        {
            var cacheKey = genCacheKey(options),//создали ключ для хранения данных
                storage = getStorage(options.localCache), //получили хранилище 
                dataType = options.dataType || storage.getItem(cacheKey + 'dataType') || 'text',//получили тип данных
                value = (storage) ? storage.getItem(cacheKey) : false;
			//если получили данные из хранилища
            if (value){
                // In the cache? Get it, parse it to json if the dataType is JSON,
                // and call the completeCallback with the fetched value.
                if (dataType.toLowerCase().indexOf('json') !== -1) value = JSON.parse(value);
                return {
					//метод открывает соединение и отправляет запрос на сервер
                    send: function(headers, completeCallback) {
                        var response = {};
                        response[dataType] = value;
                        completeCallback(200, 'success', response, '');
                    },
					//вызов xhr.abort() прерывает выполнение запроса
                    abort: function() {
                        console.log("Aborted ajax transport for json cache.");
                    }
                };
            }
        }
    });
})(jQuery, window);