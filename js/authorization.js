
// генерирует случайные числа в диапазоне от m до n
function randomNumber(m,n){
    m = parseInt(m);
    n = parseInt(n);
    return Math.floor( Math.random() * (n - m + 1) ) + m;
};

// проверяет валидность переданного элемента формы
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
				//и поле Повторите пароль пока не заполнено
				if (repeatPassword.val() ==="" || repeatPassword.val() == undefined)
					return true;
				//иначе проверим совпадение паролей
				var formGroup = repeatPassword.parents('.form-group');
				if (elem.value === repeatPassword.val()){
					formGroup.addClass('has-success').removeClass('has-error');
					return true;
				}
				else {
					if ($('input[name="repeatPassword"]').val()!=="")
						formGroup.addClass('has-error').removeClass('has-success');
					return false;
				}
			}
			break;
		case "repeatPassword":
			var modalPassword = $('#registerModal input[name="Password"]');
			var formGroup = modalPassword.parents('.form-group');
			if (elem.value === modalPassword.val() && elem.value !== ""){
				if (modalPassword.val().length>5){
					formGroup.addClass('has-success').removeClass('has-error');
				}
				return true;
			}
			else{
				formGroup.addClass('has-error').removeClass('has-success');
			}
			break;
		case "ControlSum":
			if ($.md5(+elem.value) == secretSum)
				return true;
			break;
	}
	return false;
}

//обработчик полученного от сервера объекта, выводит в форму ответ сервера
function validateByAjax (data, $form) {
	//получили поле формы для вывода ошибок
	var $mainErrorContainer = $('body').find($form.selector + ' .main-error');
	//если сервер вернул статус OK
	if (data.status === 'ok') {
		//если пользователь в этот раз ввел все правильно, спрячем поле для ошибок
		$mainErrorContainer.html(data.message).hide();
		// если с сервера пришел непустой адрес для редиректа
		if (data.data !=="")
			//перейдем по нему
			window.location.href = data.data;
		else
			//перезагрузим страницу
			window.location.reload();
	} else if (data.status === 'err') {
		//выводим ошибку (например: "Неверное имя пользователя или пароль")
		$mainErrorContainer.html(data.message).show();
	}
}

//функция отправки данных на сервер
function sendData(postArray, action, $form) {
	var ajaxObj = new AjaxRequestParent();
	var url = ajaxObj.accessToData;
	var json_string = JSON.stringify({"username": postArray['Email'], "password": postArray['Password'], "rememberMe": postArray['Remember']});
//	var json_string = "{ 'bar': 'baz' }";
	$.when(ajaxObj.requestData(url, action, json_string)).done(
		function (response) {
console.log(response);//выводим ответ сервера
			if (typeof response !== 'object') {
				try {
					response = JSON.parse(response);
				} catch (e) {
					//не удалось преобразовать ответ сервера в объект, значит, мы не сможем им воспользоваться для регистрации/авторизации/выхода
					alert('В связи с техническими неполадками сервис временно недоступен. Попробуйте зайти позднее.');
					return;
				}
			}	
			validateByAjax(response, $form);
		}).fail(function (error) {
			/*из-за ошибки мы не можем зарегистрировать/авторизовать пользователя либо позволить пользователю выйти (logout) с сайта
			*/
//console.log($form.attr('id'));
// $form.prop('tagName')
			var errorText = error.responseText;

			//если открывали модально окно для регистрации, закроем его
			if ($form.attr('id').indexOf('register')>= 0) {
				$form.modal('hide');
				errorText = 'В связи с техническими неполадками регистрация новых пользователей в настоящий момент не производится. Попробуйте зайти позднее.';
			}

			if (errorText !== "")
				alert(errorText);
			else
				alert('В связи с техническими неполадками сервис временно недоступен. Попробуйте зайти позднее.');
//alert("Ошибка при запросе к серверу: "+ JSON.stringify(error, null, 2));
console.log(error);
		}).always(function (args) {
			//снимаем блокировку с элементов формы
			var $formInputs = $('body').find($form.selector + ' input');
			var $formButtons = $form.find('button');
			$formInputs.removeAttr('readonly');			
			$formButtons.removeAttr('disabled');
		});
}

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
/*Большая часть селекторов в данном скрипте получается через $('body') т.к. форма для регистрации подгружается через Ajax (а отличие от формы авторизации, которая сразу находится на странице); при этом большинство функций обработки данных у этих форм общие*/	
	//число для формы регистрации (пользователь должен ввести сумму чисел, чтобы зарегистрироваться)
	var secretSum = 0;
	//модальное окно для регистрации
	var $formRegister = $('#registerModal');
	//форма авторизации
	var $formAuthorization = $('#loginForm');

	$('body').on('show.bs.modal', $formRegister, function (e) {
		$(e.target).find('[data-toggle="tooltip"]').tooltip({
				//чтобы подсказки для формы регистрации, которая расположена в модальном окне, отображались справа от input-ов (были видны)
				placement:	"right",
				//ручная обработка нужна, чтобы управлять событиями show/hide
				trigger:	"manual",
		});
		//при открытии модального окна для регистрации показываем числа, которые пользователь должен сложить
		var aspmA = randomNumber(1,23); // генерируем число
		var aspmB = randomNumber(1,23); // генерируем число
		var sumAB = aspmA + aspmB;  // вычисляем сумму
		// показываем пользователю выражение
		$('#aspm').html(function (){
			return aspmA + ' + ' + aspmB + ' = ';
		});
		secretSum = $.md5(sumAB);
	});

	//при закрытии модального окна очищаем его поля
	$('body').on('hide.bs.modal', $formRegister, function () {
		$('body').find('#registerModal input').each(function() {
			this.value = "";
			var formGroup = $(this).parents('.form-group');
			formGroup.removeClass('has-success').removeClass('has-error');
			secretSum = 0;
			$(this).tooltip('hide');
		});
		$('.main-error').hide();

	});

	//проверка вводимых в формы для регистрации и авторизации данных
	$('body').on("input change", ".enter :input", function() {
			$('.main-error').hide();
			//найти предков, которые имеют класс .form-group, для установления success/error
			var formGroup = $(this).parents('.form-group');
			//для валидации данных используем собственную функцию myCheckValidity
			if (myCheckValidity(this, secretSum)) {
				//добавить к formGroup класс .has-success, удалить has-error
				formGroup.addClass('has-success').removeClass('has-error');
				$(this).tooltip('hide');
			} else {
				//добавить к formGroup класс .has-error, удалить .has-success
				formGroup.addClass('has-error').removeClass('has-success');
				$(this).tooltip('show');
			}
	});

//	$('body').find($form.selector + ' input')

	$formAuthorization.find('[data-toggle="tooltip"]').tooltip({
			//чтобы подсказки для формы авторизации, которая расположена в верхнем navbar, отображались под input-ами (были видны)
			placement:	"bottom",
			trigger:	"manual",
	});

//ghb клике вне формы мелькает тоолтип???

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
		// массив для сохранения корректных input-ов формы для последующей передачи на сервер
		var postArray = [];
		//проверка корректности заполнения полей формы
		$('body').find('#registerModal input').each(function() {
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
			//блокируем элменты формы на то время, пока она отправляется, чтобы пользователь уже ничего больше не мог ввести/нажать 
			blockElementsForm($formRegister);
			sendData(postArray, "register", $formRegister);
		}
	});

	//обработка отправки формы для авторизации на сайте
	$("body").on("click", "#logIn", function(e) {
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
		sendData(arr, "logout", $formAuthorization);
	});

});
