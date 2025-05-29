let tiposElementos = ["noMetales", "metalesAlcalinos", "alcalinoTerreos", "metalesTransicion", "otrosMetales", "metaloides", "halogenos", "gasesNobles", "lantanidos", "actinidos", "noEspecifico"];
let lickable = ["safe", "maybe-not", "dont", "dead"];

function pop(checkElementos) {
    for (let cont = 0; cont <= tiposElementos.length; cont++) {
        if (checkElementos[cont] == 0) {
            const collection = document.getElementsByClassName(tiposElementos[cont]);

            for (let largo = 0; largo < collection.length; largo++) {
                collection[largo].style.animation = "unpop 0.2s linear 0s 1 forwards";
            }
        }
        else if (checkElementos[cont] == 1) {
            const collection = document.getElementsByClassName(tiposElementos[cont]);

            for (let largo = 0; largo < collection.length; largo++) {
                collection[largo].style.animation = "pop 1s";
            }
        }
    }
}

function popLick(checkElementos) {
    for (let cont = 0; cont <= lickable.length; cont++) {
        if (checkElementos[cont] == 0) {
            const collection = document.getElementsByClassName(lickable[cont]);

            for (let largo = 0; largo < collection.length; largo++) {
                collection[largo].style.animation = "unpop 0.2s linear 0s 1 forwards";
            }
        }
        else if (checkElementos[cont] == 1) {
            const collection = document.getElementsByClassName(lickable[cont]);

            for (let largo = 0; largo < collection.length; largo++) {
                collection[largo].style.animation = "pop 1s";
            }
        }
    }
}