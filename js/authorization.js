//Функционал для регистрации на сайте, входа(авторизации) и выхода с сайта(logout)

// генерирует случайные числа в диапазоне от m до n
function randomNumber(m,n){
    m = parseInt(m);
    n = parseInt(n);
    return Math.floor( Math.random() * (n - m + 1) ) + m;
};

// проверяет валидность элемента формы регистрации или формы авторизации
function myCheckValidity(elem, secretSum){
	switch (elem.name) {
		case "Email":
			if (elem.checkValidity() && elem.value !== "")
				return true;
			break;
		case "Password":
			//если пароль длиннее 5 символов
			if (elem.value.length>5){
				var repeatPassword = $('input[name="repeatPassword"]');
				//и поле "Повторите пароль" пока не заполнено
				if (repeatPassword.val() ==="" || repeatPassword.val() == undefined)
					return true;
				//иначе проверим совпадение паролей
				if (elem.value === repeatPassword.val())
					return true;
			}
			break;
		case "repeatPassword":
			var firstPassword = $('input[name="Password"]');
			if (elem.value === firstPassword.val() && firstPassword.val().length>5)
				return true;
			break;
		case "ControlSum":
			if ($.md5(+elem.value) == secretSum)
				return true;
			break;
	}
	return false;
}

//обработчик полученного от сервера ответа
function serverAnswerHandler (data, $form) {
	//получили поле формы для вывода ошибок
	var $mainErrorContainer = $('body').find($form.selector + ' .main-error');
	//если сервер вернул статус OK т.е. пользователь успешно зарегистрировался/авторизовался/вышел с сайта
	if (data.status === 'ok') {
		// если с сервера пришел непустой адрес для редиректа (т.е. была регистрация или выход с сайта)
		if (data.code !=="") {
			window.location.href = data.code;
		} else {//была авторизация
			//перезагрузим страницу
			window.location.reload();
		}
	} else {
		//выводим ошибку (например: "Неверное имя пользователя или пароль")
		$mainErrorContainer.html(data.message).show();
	}
}

//функция отправки данных на сервер
function sendData(postArray, action, $form) {
	var ajaxObj = new AjaxRequestParent();
	var url = ajaxObj.authUrl;
	var json_string = JSON.stringify({"username": postArray['Email'], "password": postArray['Password'], "rememberMe": postArray['Remember']});
	$.when(ajaxObj.requestData(url, action, json_string)).done(
		function (response) {
			//проверяем тип ответа сервера
			if (typeof response !== 'object') {
				try {
					response = JSON.parse(response);
				} catch (e) {
					//не удалось преобразовать ответ сервера в объект, значит, мы не сможем им воспользоваться для регистрации/авторизации/выхода
					alert('В связи с техническими неполадками сервис временно недоступен. Попробуйте зайти позднее.');
					return;
				}
			}	
			serverAnswerHandler(response, $form);
		}).fail(function (error) {
			/*из-за ошибки мы не можем зарегистрировать/авторизовать пользователя либо позволить пользователю выйти (logout) с сайта
			*/
			var errorText = error.responseText;

			//если открывали модально окно для регистрации, закроем его
			if ($('body').find($form.selector).attr('id').indexOf('register')>= 0) {
				$('body').find($form.selector).modal('hide');
				errorText = 'В связи с техническими неполадками регистрация новых пользователей в настоящий момент не производится. Попробуйте зайти позднее.';
			}

			if (errorText !== "")
				alert(errorText);
			else
				alert('В связи с техническими неполадками сервис временно недоступен. Попробуйте зайти позднее.');
		}).always(function (args) {
			//снимаем блокировку с input-ов формы
			var $formInputs = $('body').find($form.selector + ' input');
			var $formButtons = $form.find('button');
			$formInputs.removeAttr('readonly');			
			$formButtons.removeAttr('disabled');
		});
}

//блокирует input-ы формы (на время отправки и получения данных с сервера)
function blockElementsForm ($form) {
	//получили все input, textarea, select
	var $formInputs = $('body').find($form.selector + ' input');

	//присвоили их атрибутам readonly значение readonly
	$formInputs.attr('readonly', 'readonly');

	var $formButtons = $form.find('button');
	//заблокировали кнопки
	$formButtons.attr("disabled", "disabled");	
}


$(document).ready(function() {
/*Большая часть селекторов в данном скрипте получается через $('body') т.к. форма для регистрации находится в модальном окне, подгружаемом через Ajax (в отличие от формы авторизации, которая сразу находится на странице); при этом функции валиации данных, отправки данных на сервер и обработки ответа сервера у этих форм общие*/	
	//число для формы регистрации (пользователь должен ввести сумму чисел, чтобы зарегистрироваться)
	var secretSum = 0;
	//модальное окно для регистрации
	var $windowRegister = $('#registerModal');
	//форма авторизации
	var $formAuthorization = $('#loginForm');

	//при открытии модального окна для регистрации показываем числа, которые пользователь должен сложить
	$('body').on('show.bs.modal', $windowRegister, function (e) {
		var aspmA = randomNumber(1,23); // генерируем число
		var aspmB = randomNumber(1,23); // генерируем число
		var sumAB = aspmA + aspmB;  // вычисляем сумму
		// показываем пользователю выражение
		$('#aspm').html(function (){
			return aspmA + ' + ' + aspmB + ' = ';
		});
		secretSum = $.md5(sumAB);
		
		$(e.target).find('[data-toggle="tooltip"]').tooltip({
				//чтобы подсказки для формы регистрации, которая расположена в модальном окне, отображались справа от input-ов (были видны)
				placement:	"right",
				//ручная обработка нужна, чтобы управлять событиями show/hide
				trigger:	"manual",
		});
	});

	//при закрытии модального окна очищаем его поля
	$('body').on('hide.bs.modal', $windowRegister, function (e) {
		$(e.target).find('input').each(function() {
			this.value = "";
			var formGroup = $(this).parents('.form-group');
			formGroup.removeClass('has-success').removeClass('has-error');
			secretSum = 0;
			$(this).tooltip('hide');
		});
		$('.main-error').hide();

	});

	//проверка вводимых в формы для регистрации и авторизации данных
	$('body').on("input", ".enter :input", function(e) {
			$('.main-error').hide();
			//проверка длины нужна т.к. иначе в IE данная функция вызывается просто при открытии формы регистрации и, соответственно, поля сразу подсвечены красным и выведены подсказки (еще до того, как пользователь ввел хотя бы символ) 
			if (this.value.length > 0) {
				//найти предков, которые имеют класс .form-group, для установления success/error
				var formGroup = $(this).parents('.form-group');
				//для валидации данных используем собственную функцию myCheckValidity
				if (myCheckValidity(this, secretSum)) {
					formGroup.addClass('has-success').removeClass('has-error');
					$(this).tooltip('hide');
				} else {
					formGroup.addClass('has-error').removeClass('has-success');
					$(this).tooltip('show');
				}
			}
	});

	$formAuthorization.find('[data-toggle="tooltip"]').tooltip({
			//чтобы подсказки для формы авторизации, которая расположена в верхнем navbar, отображались под input-ами (были видны)
			placement:	"bottom",
			trigger:	"manual",
	});

	//прячем подсказки по клику или движению мыши
	$('body').on('click mouseover', function (e) {
		//получаем элемент, по которому кликнули
		var t = e.target || e.srcElement;
		//получаем название тега
		var elmID = t.id;
		if (elmID !=="logIn" && elmID !=="checkIn")
			$('[data-toggle="tooltip"]').tooltip('hide');
	});

	//обработка отправки формы для регистрации на сайте
	$("body").on("click", "#checkIn", function(e) {
		/*Без preventDefault форма закроется раньше, чем произойдут отправка-получение данных с сервера и будет ошибка с параметрами: readyState: 0, responseText: undefined, status: 0, statusText: "error"
		It's could be possible to get a status code of 0 if you have sent an ajax call and a refresh of the browser was trigger before getting the ajax response. The ajax call will be cancelled and you will getting this status.
		a form submission can cancel the ajax call.
		+чтобы форма не закрывалась до тех пор, пока все поля не будут заполнены корректно
		*/
		e.preventDefault();
		var formValid = true;
		// массив для сохранения корректных данных из формы для последующей передачи на сервер
		var postArray = [];
		//проверка корректности заполнения полей формы
		$('body').find($windowRegister.selector+' input').each(function() {
			var elemName = $(this).attr('name');
			//найти предков, которые имеют класс .form-group, для установления success/error
			var formGroup = $(this).parents('.form-group');
			if (!myCheckValidity(this, secretSum)) {
				formGroup.addClass('has-error');
				formValid = false;
				$(this).tooltip('show');
			}
			else
				postArray[elemName] = $(this).val();
		});
		//если форма валидна, то
		if (formValid) {
			//блокируем элменты формы на то время, пока она отправляется, чтобы пользователь ничего больше не мог ввести/нажать 
			blockElementsForm($windowRegister);
			//отправляем данные на сервер
			sendData(postArray, "register", $windowRegister);
		}
	});
	
	/*поскольку $("body").on("submit", $registerForm, function(e) {...}); видимо ввиду динамической подгрузки этой формы через AJAX не работает, и отправка данных происходит по клику на кнопку (см. функцию выше), отдельно обработаем отправку данных формы по нажатию на Enter*/
	$(window).keydown(function(event){
		//ловим событие нажатия клавиши
		if(event.keyCode == 13 && $('body').attr("class")=="modal-open") {	//если это Enter и открыто модальное окно
			event.preventDefault();
			$('#checkIn').click();
		}
	});

	//обработка отправки формы для авторизации на сайте
	$("body").on("submit", $formAuthorization, function(e) {
		e.preventDefault();
		var formValid = true;
		var postArray = [];

		$formAuthorization.find('input').each(function() {
			var elemName = $(this).attr('name');
			if ($(this).attr('type') != "checkbox"){
				var formGroup = $(this).parents('.form-group');
				if (!myCheckValidity(this, secretSum)) {
					formGroup.addClass('has-error');
					formValid = false;
					$(this).tooltip('show')
				}
				else
					postArray[elemName] = $(this).val();
			} else {
				//третьим элементом массива будет значение chekbox (true=1 или false=0); если передавать просто true или false, то на сервере false воспринимается php как строка и равен true, а 0 и "0" в php равны false
				if ($(this).is(':checked'))
					postArray[elemName] = 1;
				else
					postArray[elemName] = 0;
			}
		});
		if (formValid) {
			blockElementsForm($formAuthorization);
			sendData(postArray, "login", $formAuthorization);
		}
	});
	
	//обработка выхода (logout) с сайта
	$("#exit").on("click",function(e) {
		e.preventDefault();
		var arr = [];
		//отключаем создание cookie при перезагрузке страницы, определенное в init.js, чтобы при загрузке страницы не было ни кук, ни userID с сервера 
		$(window).off('unload');
		sendData(arr, "logout", $formAuthorization);
	});

});
