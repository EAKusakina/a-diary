//Функционал для конструирования корректной страницы сайта (меню, navbar, контент) в зависимости от того, авторизован ли пользователь, какая страница запрошена с сервера (общедоступная, только для авторизованных пользователей, модальное окно для регистрации и т.д.)

//осуществляет переход к якорю на загруженной странице
function goToHash() {
	if (history.state.hash != "" && history.state.hash != undefined) {
		//определим место в тексте страницы, на которое hash ссылается
		var target_top= $(history.state.hash).offset().top;
		//и перейдем к нему
		$('html, body').animate({scrollTop:target_top}, 'slow');
	}
	//обновили scrollspy и affix, чтобы корректно работало боковое меню на странице с описанием сайта
	/*Плагин ScrollSpy используется для отслеживания раздела, в котором сейчас находится пользователь и подсвечивания этого раздела в меню.	
	Плагин Twitter Bootstrap Affix предназначен для "прикрепления" элемента веб-страницы к краям окна браузера. "Прикреплённый" элемент при прокрутке веб-страницы будет оставаться в определённом месте и находиться в поле зрения пользователя. Плагин affix позволяет также выключать это "прикрепление"*/	
	$('#sidebar').affix('checkPosition');
	$('body').scrollspy('refresh');
}

// получает с сервера запрашиваемые страницы (содержимое файлов в папке inc), проверяет возможность их вывода на экран(авторизован пользователь или нет) и выводит соответствующий ситуации контент
function openPage(namePage){
	var ajaxGetPage = new AjaxRequestParent();
	//если пользователь, который уже подтвердил e-mail, пытается обновить страницу с благодарностью за регистрацию, перебросим его на главную
	if (namePage.indexOf('thanksForRegister')>= 0 && userID>0) {
		namePage = '/inc/index.inc.php';
		history.replaceState({path:namePage}, null, 'http://'+location.host+'/inc/index.inc.php');
	}
	//удалили подсветку у всех пунктов меню
	$('#control li').removeClass('active');
	// подсветили пункт меню, соответствующий загружаемой странице (name *= value - получение элементов, у которых значение атрибута name содержит подстроку value)
	$('#control').find('[href *= "'+namePage+'"]').parent().addClass('active');
	//приводим namePage к подходящему для обработки на сервере виду
	if (namePage.indexOf('/inc')==0)
		namePage = ".."+namePage;
	//для получения контента страниц не используем ajaxGetPage.requestData т.к. там dataType = "json" и при попытке получить html возникает ошибка (readyState: 4, responseText: <текст html> status: 200, statusText: "OK") 
	$.ajax({
		type: 'POST',
		url: ajaxGetPage.accessToPage,
		data: {namePage: namePage},
	}).done(function( response ) {// вывод в блок <div id="data"> index.php контента страницы
		//если запрошена страница, доступная только авторизованным пользователям
		if (response.indexOf('personalPage') >= 0 ) {
			//и пользователь авторизован
			if (userID>0) {
				//в зависимости от адреса страницы, сразу после подгрузки полученного с сервера контента, запустим соответсвующий странице триггер
				//для страницы "Создание, редактирование и удаление событий"
				if (namePage.indexOf('events')>= 0)
					$('#data').html(response).trigger('loadToday');
				//для страницы "Создание, редактирование и удаление категорий"
				if (namePage.indexOf('categories')>= 0)
					$('#data').html(response).trigger('loadCategories');
				//для страницы "Экспорт событий в Excel"	
				if (namePage.indexOf('export')>= 0)
					$('#data').html(response).trigger('export');
			}
		} else {
			//если получили html модального окна
			if (response.indexOf('registerModal') >= 0 ) {
				//вставим его код на страницу index.php
				$('#htmlModal').html(response);
				//и откроем окно
				$('#openModal').click();				
				return;
			}
			$('#data').html(response);
			goToHash();
		}
	}).fail(function( error ) {
		/*из-за ошибки мы не можем получить содержимое запрашиваемой страницы, поэтому вместо содержимого будем выводить сообщение об ошибке*/
		ajaxGetPage.showErrorPage(error);
	});
}
    
$(document).ready(function() {

	//глобальная переменная, содержащая уникальный идентификатор пользователя; если она пуста, значит, пользователь не авторизован 
	userID = "";
	
	//объект для получения данных с сервера
	var ajaxObj = new AjaxRequestParent();
	
	// получаем текущий pathname; если pathname не существует, то присваиваем pathname главной страницы 
	var path = document.location.pathname;
	if (path == "/" || path == '/index.php')
		path = '/inc/index.inc.php';
    //задаем параметры для текущего состояния (объект состояния, необязательный заголовок и URL новой записи истории)
	history.replaceState({path:path, hash:document.location.hash}, null, document.location.href);
	
	//скроем область с контентом, пока он не будет получен с сервера
	$('#allContent').hide();
	
	var fl = true;
	
	//запрашиваем userID пользователя с сервера (получим его только если есть соответствующая сессионная переменная или cookie, созданный когда пользователь ставил галку "Запомнить меня" при авторизации)
	$.when( ajaxObj.requestData(ajaxObj.authUrl, "getUserID", null))
		.always(function() {
			//прячем gif-картинку, которая показывалась, пока данные загружались с сервера, и показываем область контента
			$('#preloader').hide();
			$('#allContent').show();

			//при клике на "Зарегистрироваться" подгружаем модальное окно с формой регистрации
			$('#loadModal').click(function(){
				openPage("/inc/modal.inc.php");
				return false;
			});

			// при клике на логотип открываем главную страницу, при клике на ссылку меню - соответствующую страницу
			$('body').on('click', '.navbar-brand, #control a', function() {
				var linkPath = $(this).attr('href');			
				//создаем новую запись в истории когда кликаем по ссылке
				history.pushState({path:linkPath}, null, linkPath);
				// открываем страницу
				openPage(linkPath); 
				//чтобы не было перезагрузки страницы
				return false;			
			});
			// обработчик нажатий на кнопки браузера назад/вперед 
			$(window).on('popstate', function(e) {
				e.preventDefault();
				//если объект history.state не пуст - открываем соответствующую страницу
				if ( !isEmpty(history.state) ){
					//если это уже загруженная страница, где нужно только перейти к hash
					if ($('#data').html().indexOf('bs-docs-sidebar')>=0 && history.state.path.indexOf("/inc/description.inc.php")>=0)
						goToHash();
					else 	
						openPage(history.state.path);
				} else {
					path = document.location.pathname;
					if (path == "/" || path == '/index.php')
						path = '/inc/index.inc.php';
					history.replaceState({path:path, hash:document.location.hash}, null, document.location.href);
				}
			});
		}).done(function (response) {			
			//обработчик ответа сервера responseHandler находится в proto.js
			var resp = ajaxObj.responseHandler(response);			
			userID = resp;
			//если пользователь авторизован
			if (userID>0) {
				//спрячем пункты navbar, которые показываются неавторизованным пользователям ("Зарегистрироваться", форма для входа на сайт)
				$('.nonAuthorized').hide();
				//получим контент страницы
				openPage(path);
			} else if (resp === null) {//пользователь оказался не авторизован
				//спрячем пункты меню и navbar, которые показываются авторизованным пользователям 				
				$('.personalItems').hide();
				$('.authorized').hide();			
				//если запрошенной страницы нет среди страниц для авторизованных пользователей
				if ($('.personalItems').find('[href *= "'+path+'"]').length==0) {
					//откроем ее
					openPage(path);
				} else 
					$('#data').html('<div id = "textError"><h3>Для работы с данными необходимо войти на сайт.</h3></div>');					
			}	
		}).fail(function (error) {
			/*из-за ошибки мы не можем проверить, авторизован пользователь или нет,
			поэтому будем показывать только общедоступные страницы, а на страницах для зарегистрированных пользователей выводить сообщение об ошибке
			*/
			$('.personalItems').hide();
			$('.authorized').hide();

			//если запрошенной страницы нет среди страниц для авторизованных пользователей
			if ($('.personalItems').find('[href *= "'+path+'"]').length==0)
				//откроем ее
				openPage(path);				
			else //иначе выведем сообщение об ошибке
				ajaxObj.showErrorPage(error);
		});
	
	//для корректного отображения бокового меню на странице "Описание сайта"
	$('body').scroll(function(){
		$('body').scrollspy('refresh');
	});
});


/*Синхронные запросы применяются только в крайнем случае, когда кровь из носу необходимо дождаться ответа сервера до продолжения скрипта. В 999 случаях из 1000 можно использовать асинхронные запросы. При этом общий алгоритм такой:

Делаем асинхронный запрос
Рисуем анимированную картинку или просто запись типа "Loading..."
В onreadystatechange при достижении состояния 4 убираем Loading и, в зависимости от status вызываем обработку ответа или ошибки. http://xmlhttprequest.ru/#encoding*/	
