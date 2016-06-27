<?php 
if($ajax) {
  echo "<h1>К сожалению, запрошенная Вами страница не найдена.</h1>
	<h3>Попробуйте <a href = 'http://".$_SERVER['HTTP_HOST']."/index.php'>перейти на главную</a> и попробовать что-нибудь ещё.</h3>";
} else{
  include '../inc/index.inc.php';
}

