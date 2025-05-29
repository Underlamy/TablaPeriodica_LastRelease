$(document).ready(function () {
    $('#settings').click(function () {
        $('.menu_filter').css("display", "block");
    });

    $('.close').click(function () {
        $('.menu_filter').css("display", "none");
    });

    $('input[name="color_mode"]').change(function () {
        const selectedValue = $('input[name="color_mode"]:checked').val();

        // Hacer la llamada AJAX
        $.ajax({
            url: '/elementos', // tu ruta en el servidor
            type: 'GET',
            data: {
                type: selectedValue
            },
            success: function (respuesta) {
                $('#ajax').html(respuesta);
                const rawData = $('#resultados-query').data('json');

                if (selectedValue == "lickable") {
                    rawData.forEach(element => {
                        let box = $('.' + element.numAtomico);

                        switch (element.lickable.data[0]) {
                            case 0:
                                box.addClass("safe")
                                break;

                            case 1:
                                box.addClass("maybe-not")
                                break;

                            case 2:
                                box.addClass("dont")
                                break;

                            case 3:
                                box.addClass("dead")
                                break;
                        }
                    });
                    $('.0').fadeOut(50);
                }else{
                    $('.0').fadeIn(50);
                    $('.safe').removeClass('safe');
                    $('.maybe-not').removeClass('maybe-not');
                    $('.dont').removeClass('dont');
                    $('.dead').removeClass('dead');
                }
            },
        });
    });
});