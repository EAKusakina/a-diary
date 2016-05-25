// Загрузка запрашиваемых страниц с сервера
function openPage(uri){
	var ajaxObj = new AjaxRequestParent(),
		hash = "";
	//если пользователь, который уже подтвердил e-mail, пытается обновить страницу с благодарностью за регистрацию, перебросим его на главную
	if (uri.indexOf('thanksForRegister')>= 0 && userID>0) {
		uri = 'inc/index.inc.php';
		history.replaceState({uri:uri}, null, "http://food.diary/"+uri);
	}

	if (intervalID != "")
		clearInterval(intervalID);

	//если прислали uri с #
	var numHash = uri.indexOf('#');
	if (numHash>=0){
		//запомнили все, что после # (вместе с #)
		hash = uri.substr(numHash);
		//из uri убрали # и все, что после
		uri = uri.slice(0, numHash);
		if (uri.indexOf('..')==0)
			uri = uri.substr(2);//убираем точки, чтобы сработала подсветка пункта меню
	}	
	$('#control li').removeClass('active');
	// name *= value (элементы, у которых значение атрибута name содержит подстроку value)
	$('#control').find('[href *= "'+uri+'"]').parent().addClass('active');
	if (uri.indexOf('inc/')==0) 
		uri = "../"+uri;
	if (uri.indexOf('/inc')==0)
		uri = ".."+uri;
	if (uri.indexOf('index.php')==0) {
		uri = "../"+uri;		
		$('#control').find('[href *= "inc/index.inc.php"]').parent().addClass('active');
	}
	console.log(uri);
	//	не используем ajaxObj.requestData т.к. там dataType = "json" и при попытке получить html возникает ошибка ( readyState: 4, responseText: <текст html cnhfybws> status: 200, statusText: "OK") 
	$.ajax({
		type: 'POST',
		url: ajaxObj.accessToPage,
		data: {uri: uri},
	}).done(function( response ) {
		// вывод в блок <div id="data">
		if (response.indexOf('personalPage') >= 0 ) {
			if (userID>0) {
				if (uri.indexOf('events')>= 0)
					$('#data').html(response).trigger('loadToday');
				if (uri.indexOf('categories')>= 0)
					$('#data').html(response).trigger('loadCategories');
				if (uri.indexOf('export')>= 0)
					$('#data').html(response).trigger('export');
			}
		} else {
			//если получили html модального окна
			if (response.indexOf('registerModal') >= 0 ) {
				//вставим его код на страницу
				$('#htmlModal').html(response);
				//и откроем окно
				$('#openModal').click();				
				return;
			}
			$('#data').html(response);
			//обновили scrollspy и affix, чтобы корректно работало боковое меню на странице с описанием сайта
			$('body').scrollspy('refresh');
			$('#sidebar').affix('checkPosition');
			if (hash !== "") {
				history.replaceState({uri:uri+hash}, null, uri+hash);
				var s = $(hash)[0].offsetTop;
				console.log('s = '+s);
				$('body').scrollTop(s+50);
				$('#sidebar').find('[href *= "'+hash+'"]').parent().addClass('active');
			}
		}
	}).fail(function( error ) {
		console.log(error);
		/*из-за ошибки мы не можем получить содержимое запрашиваемой страницы, поэтому вместо содержимого будем выводить сообщение об ошибке*/
		ajaxObj.showErrorPage(error, 'openPage,auth.js');
	});
}
    
//Возвращает текущий URI страницы
function getThisUri(){
   var loc = event.location 
	|| ( event.originalEvent && event.originalEvent.location )
	|| document.location;   
	console.log('loc+hash = '+ loc.pathname.substr(1)+loc.hash);
//	console.log('hash = '+ window.location.hash);
	return loc.pathname.substr(1)+loc.hash;
}     

function changeHistory(that) {
	var uri = that.attr('href');
	
	//создаем новую запись в истории когда кликаем по ссылке
	history.pushState({uri:uri}, null, uri);
	  
	// открываем страницу
	openPage(uri);      	
}

$(document).ready(function() {

	$('body').scrollspy({
		target: '.bs-docs-sidebar',
		//отступ от верха эрана после которого активным становится следующий элемент бокового меню
		offset: 40
	});
	$('body #sidebar').affix({
		offset: {
		  top: 60
		}
	});
	
	userID = "";
	storageName = "";
	//идентификатор setInterval, работающей на странице с событиями(today); используется для удаления ранее установленного setInterval, когда пользователь переходит на др страницу/обновляет ее
	intervalID = "";
	
	$('#allContent').hide();
	
	var ajaxObj = new AjaxRequestParent();
	var url = ajaxObj.accessToData;
/*Синхронные запросы применяются только в крайнем случае, когда кровь из носу необходимо дождаться ответа сервера до продолжения скрипта. В 999 случаях из 1000 можно использовать асинхронные запросы. При этом общий алгоритм такой:

Делаем асинхронный запрос
Рисуем анимированную картинку или просто запись типа "Loading..."
В onreadystatechange при достижении состояния 4 убираем Loading и, в зависимости от status вызываем обработку ответа или ошибки. http://xmlhttprequest.ru/#encoding*/	
	$.when( ajaxObj.requestData(url, "getUserID", "")).always(function() {
			$('#preloader').hide();
			$('#allContent').show();

			//клик на "Зарегистрироваться"
			$('#loadModal').click(function(){
				openPage("inc/modal.inc.php");
				return false;
			});

			// клик на логотип
			$('.navbar-brand').click(function(){
				changeHistory($(this));
				return false;
			});
			
			// клик на ссылки переключения страниц
			$('#control a').click(function(){
				changeHistory($(this));
				return false;
			});
			
			// обработчик нажатий на кнопки браузера назад/вперед 
			$(window).bind('popstate', function() {
				var uri = ( isEmpty(history.state) ) ? "" : history.state.uri;
//				console.log('uri = ' + uri);
				if ( uri!==""){
						openPage(uri); 
				} else {
					var tmp = getThisUri();
					uri = tmp ? tmp :'inc/index.inc.php';
					history.replaceState({uri:uri}, null, "http://food.diary/"+uri);
				}
			});
		}).done(function (response) {
			console.log(response);
			var resp = ajaxObj.reponseHandler(response);
			//если пользователь авторизован
			if (resp) {
				userID = resp;
				storageName = userID;
				$('.nonAuthorized').hide();
			} else {
				$('.personalItems').hide();
				$('.authorized').hide();					
			}				
			openPage(history.state.uri);  
		}).fail(function (error) {
			/*из-за ошибки мы не можем проверить, авторизован пользователь или нет,
			поэтому будем показывать только общедоступные страницы, а на страницах для зарегистрированных пользователей выводить сообщение об ошибке
			*/
			$('.personalItems').hide();
			$('.authorized').hide();

			var errorText = "";
			if (error.responseText !== "")
				errorText = error.responseText;
			else
				errorText = "В связи с техническими неполадками данная страница временно недоступна. Попробуйте зайти позднее.";							
			$('#data').html('<div id = "textError"><h3>' + errorText + '</h3></div>');
			openPage(history.state.uri);
			console.log(error);
		});
	
	// получаем текущий uri, если uri не существует то присваиваем uri первой страницы 
    var tmp = getThisUri();
	var thisUri = tmp ? tmp :'inc/index.inc.php';
    console.log("thisUri = " + thisUri);

    //сразу задаем параметры для текущего состояния
    history.replaceState({uri:thisUri}, null, "http://food.diary/"+thisUri);
    	
});