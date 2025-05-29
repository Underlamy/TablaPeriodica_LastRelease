import { scene } from './init.js';
import { elemento } from "./functions/interactive.js";

$(document).ready(function () {
    $('#settings').click(function () {
        $('.menu_filter').css("display", "block");
    });

    $('#wireframe').change(function () {
        if ($(this).prop("checked")) {
            elemento.forEach(element => {
                if(elemento != undefined){
                    scene.getObjectById(element.id).userData.wireframe(true);
                }
            });
        } else {
            console.log("wawa");
        }
    });
});

console.log("aaaaaaa");