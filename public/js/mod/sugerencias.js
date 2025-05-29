$(document).ready(function () {
    $('.aceptar').click(function () {
        $(this).parent().parent().hide();
        let id = $(this).data('id');

        $.ajax({
            url: 'http://localhost:3000/aceptar',
            type: 'POST',
            contentType: 'application/json',
            data: JSON.stringify({
                idSugerencia: id
            }),
            success: function (response) {
                console.log('Respuesta del servidor:', response);
            },
            error: function (xhr, status, error) {
                console.error('Error:', error);
            }
        });
    });

    $('.rechazar').click(function () {
        $(this).parent().parent().hide();
        let id = $(this).data('id');

        $.ajax({
            url: 'http://localhost:3000/rechazar',
            type: 'POST',
            contentType: 'application/json',
            data: JSON.stringify({
                idSugerencia: id
            }),
            success: function (response) {
                console.log('Respuesta del servidor:', response);
            },
            error: function (xhr, status, error) {
                console.error('Error:', error);
            }
        });
    });

    $('input[name="type"]').change(function () {
        const nuevoValor = $(this).val();

        // Obtener los parámetros actuales
        const params = new URLSearchParams(window.location.search);
        params.set('t', nuevoValor);

        // Opcional: actualizar URL en el navegador sin recargar
        const nuevaURL = window.location.pathname + '?' + params.toString();
        window.history.pushState({}, '', nuevaURL);

        // Hacer la llamada AJAX
        $.ajax({
            url: '/loadMod', // tu ruta en el servidor
            type: 'GET',
            data: params.toString(),
            success: function (respuesta) {
                $('#ajax').html(respuesta); // reemplaza el contenido
            },
            error: function () {
                $('#contenido').html('<p>Error al cargar contenido.</p>');
            }
        });
    });

    $('input[name="date"]').change(function () {
        const nuevoValor = $(this).val();

        // Obtener los parámetros actuales
        const params = new URLSearchParams(window.location.search);
        params.set('f', nuevoValor);

        // Opcional: actualizar URL en el navegador sin recargar
        const nuevaURL = window.location.pathname + '?' + params.toString();
        window.history.pushState({}, '', nuevaURL);

        // Hacer la llamada AJAX
        $.ajax({
            url: '/loadMod', // tu ruta en el servidor
            type: 'GET',
            data: params.toString(),
            success: function (respuesta) {
                $('#ajax').html(respuesta); // reemplaza el contenido
            },
            error: function () {
                $('#contenido').html('<p>Error al cargar contenido.</p>');
            }
        });
    });

    $('input[name="validar"]').change(function () {
        const nuevoValor = $(this).val();

        // Obtener los parámetros actuales
        const params = new URLSearchParams(window.location.search);
        params.set('v', nuevoValor);

        // Opcional: actualizar URL en el navegador sin recargar
        const nuevaURL = window.location.pathname + '?' + params.toString();
        window.history.pushState({}, '', nuevaURL);

        // Hacer la llamada AJAX
        $.ajax({
            url: '/loadMod', // tu ruta en el servidor
            type: 'GET',
            data: params.toString(),
            success: function (respuesta) {
                $('#ajax').html(respuesta); // reemplaza el contenido
            },
            error: function () {
                $('#contenido').html('<p>Error al cargar contenido.</p>');
            }
        });
    });

    $('input[name="revisar"]').change(function () {
        const nuevoValor = $(this).val();

        // Obtener los parámetros actuales
        const params = new URLSearchParams(window.location.search);
        params.set('r', nuevoValor);

        // Opcional: actualizar URL en el navegador sin recargar
        const nuevaURL = window.location.pathname + '?' + params.toString();
        window.history.pushState({}, '', nuevaURL);

        // Hacer la llamada AJAX
        $.ajax({
            url: '/loadMod', // tu ruta en el servidor
            type: 'GET',
            data: params.toString(),
            success: function (respuesta) {
                $('#ajax').html(respuesta); // reemplaza el contenido
            },
            error: function () {
                $('#contenido').html('<p>Error al cargar contenido.</p>');
            }
        });
    });
});
