<?
//	include 'inc/lib.inc.php';
//	include 'inc/cookie.ini.php';
	if ($_SERVER["REQUEST_METHOD"] === "GET" && isset($_GET['code'])) 
		include 'php/finishingRegister.php';
	
	function foo(){
		session_start();
		echo "SESSION['user_id'] =".$_SESSION['user_id']."<br>";
		echo "COOKIE['sid'] = ".$_COOKIE['sid']."<br> SESSION = ";
		var_dump($_SESSION);
		echo "<br> GET=";
		var_dump($_GET);
		echo "<br> REQUEST =";
		var_dump($_REQUEST);
		echo "<br> COOKIE =";
		var_dump($_COOKIE);
	//	echo session_save_path();
		session_write_close();
	}	
//	foo();
	
?>
<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml" xml:lang="ru" lang="ru">
	<head>
		<title></title>
		<meta http-equiv="content-type"
			content="text/html;charset=utf-8" />
		<link rel="stylesheet" href="/css/bootstrap.min.css" />
		<link rel="stylesheet" href="/css/bootstrap-theme.min.css" />
		<link rel="stylesheet" href="/css/jquery-ui.css">
		<link rel="stylesheet" type="text/css" href="/css/style.css" />
		<script src="/js/jquery-2.2.1.min.js"></script>
		<script src="/js/jquery-ui.js"></script>
		<script src="/js/datepicker-ru.js"></script>
		<script src="/js/bootstrap.min.js"></script>
		<script src="/js/md5.js"></script>
		<script src="/js/init.js"></script>
		<script src="/js/proto.js"></script>
		<script src="/js/authorization.js"></script>
		<script src="/js/events.js"></script>
		<script src="/js/categories.js"></script>
		<script src="/js/export.js"></script>

<!-- подключить JSON библиотеку -->		
	</head>
	<body>
		<!-- Изображение, появляющееся на время загрузки контента -->
		<img id="preloader" src="/img/ajax-loader.gif" alt="AJAX loader" title="AJAX loader"/>
		
		<!-- Сюда подгружается модальное окно для регистрации -->
			<div id = "htmlModal"> </div>
			<div id = "openModal" data-toggle="modal" data-target="#registerModal"></div>
	<div id ="allContent">	
		<!-- Верхняя часть страницы -->
		<div id="header">
				<nav class="navbar navbar-default">
					<div class="container-fluid">
						<div class="navbar-header">
							<button type="button" class="navbar-toggle collapsed" data-toggle="collapse" data-target="#bs-example-navbar-collapse-1" aria-expanded="false">
								<span class="sr-only">Toggle navigation</span>
								<span class="icon-bar"></span>
								<span class="icon-bar"></span>
								<span class="icon-bar"></span>
							</button>
							<a class="navbar-brand" href="/inc/index.inc.php">Логотип</a>
						</div>
						<div class="collapse navbar-collapse" id="bs-example-navbar-collapse-1">
							<ul id = "authInfo" class="nav navbar-nav navbar-right">
							
								<li class = "authorized" class="dropdown">
									<a href="#" class="dropdown-toggle" data-toggle="dropdown" role="button" aria-haspopup="true" aria-expanded="false">Вход выполнен <span class="caret"></span></a>
									<ul class="dropdown-menu">
										<li><a id = "exit" href="#">Выйти</a></li>
									</ul>
								</li>
								<li class = "nonAuthorized">
									<a id = "loadModal" href="#">
									<span class="glyphicon glyphicon-log-in"></span> Зарегистрироваться</a>
								</li>
								<li class = "nonAuthorized">
									<form id="loginForm" class="navbar-form navbar-right enter">
										<div class="form-group">
											<input type="email" data-toggle="tooltip" class="form-control" name="Email" placeholder="E-mail" title="" data-original-title="Введите E-mail в правильном формате">
										</div>
										<div class="form-group">
											<input type="password" data-toggle="tooltip" class="form-control" name="Password" placeholder="Пароль" title="" data-original-title="Пароль должен быть длиннее 5 символов">
										</div>
											<div class="checkbox"><label><input name="Remember" type="checkbox"> Запомнить меня</label></div>
											<button id="logIn" type="submit" class="btn btn-default">Войти</button>
										<p class="main-error"></p>
									</form>
								</li>							
							</ul>
						</div>
					</div>
				</nav>			
		</div>
		<div class="col-md-2 col-xs-12 col-sm-2">		
			<div id="nav" >
				<!-- Навигация -->
				<ul id = "control" class="nav nav-pills nav-stacked">
					<li><a href='/inc/index.inc.php'>Главная</a></li>
					<li><a href='/inc/description.inc.php'>Описание сайта</a></li>
					<li class="personalItems"><a href='/inc/categories.inc.php'>Категории</a></li>
					<li class="personalItems"><a href='/inc/events.inc.php'>События</a></li>
					<li class="personalItems"><a href='/inc/export.inc.php'>Экспорт событий</a></li>
				</ul>
			</div>
		</div>
		<div class="col-md-10 col-xs-12 col-sm-10">		
			<!-- Верхняя часть страницы -->
			<div id="content">
				<!-- Область основного контента -->
				<div id="data"></div>  
			</div>
		</div>
	</div>	
	</body>
</html>