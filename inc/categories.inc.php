<?php 
if($ajax) {
  echo '<section class="personalPage">
	<h1>Создание, редактирование и удаление категорий</h1>

    <div id="categories" class="col-md-12 table-responsive">
	</div>
	<div id="buttons" class="row col-md-12">
	</div>	

</section>';
} else{
  include '../inc/index.inc.php';
}

