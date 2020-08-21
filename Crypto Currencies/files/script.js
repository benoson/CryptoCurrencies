(function() { // IIFE

    $(function() { // shorthand for (document).ready()


        // ------------------------- Defining global variables and event listeners ------------------------- //

        const DOMAIN = "https://api.coingecko.com";
        const allCoinsURL = DOMAIN + "/api/v3/coins";
        
        // defining the cache for all the coins
        let allCoinsCache = new Array();

        // defining the 'More Info' cache, for each coin
        let moreInfoDataCache = new Map();

        // defining the selected coins by the user
        let selectedCoinsToDisplay = new Array();

        // defining the maximum number of coins the user can select
        let maxNumberOfSelectedCoinsAllowed = 5;

        // defining the state for the toggled buttons, in order to track down which coins are selected
        let toggledButtonsStates = new Array();

        // defining the main section, which holds the currently displayed section
        const mainSectionContainer = $("#main-section");

        // creating the home section button
        const homeSectionBtn = $("#homeBtn");
        homeSectionBtn.click(displayHomeSection);

        // creating the live reports section button
        const liveReportsBtn = $("#liveReportsBtn");
        liveReportsBtn.click(displayLiveReportsSection);

        // creating the 'about' section button
        const aboutBtn = $("#aboutBtn");
        aboutBtn.click(displayAboutSection);

        // defining the 'about' section
        const aboutSection = $("#aboutSection");

        // creating the coins search button
        const searchCoinsBtn = $("#searchCoinsBtn");
        searchCoinsBtn.click(inputFieldValidation);
        searchCoinsBtn.hover(onSearchBtnHover);

        // creating a variable that holds the interval function for the live reports section.
        // when this variable is global, we can stop the interval function from anywhere.
        let getPricesDataInterval;

        // checking if the coins exist in the cache, in order to display them as the user opens the website
        checkIfCoinsExistInCache();

        // defining the navigation bar
        const navbar = $(".navbar");

        // on window scroll, if the screen Y axis scroll is larger than 220, add a class to the navbar
        window.onscroll = () => {
            if (window.scrollY > 160) {
                navbar.addClass('nav-colorful');
            }

            else {
                navbar.removeClass('nav-colorful');
            }
        };




        // ---------------------------------------- Functions ---------------------------------------- //


        // -------------------- Model and Server -------------------- //

        function getMoreInfoDataFromServer(clickedCoinURL, coinCardContainer, coin, moreInfoButton) {

            // displaying the loading image while the user waits for the 'more info' data to load
            displayLoadingAnimation(coinCardContainer.children().first());


            // making an Ajax 'GET' request for the extended info about the coin, from the server
            $.get(clickedCoinURL).then( moreInfoData => {


                // defining an object that holds the values for the 'more info' data section for the specific coin
                let moreInfoDataObject = {
                    imageURL: moreInfoData.image.large,

                    priceInUSD: moreInfoData.market_data.current_price.usd,
                    priceInEUR: moreInfoData.market_data.current_price.eur,
                    priceInILS: moreInfoData.market_data.current_price.ils,
                };


                // inserting the newly retrieved 'more info' data from the server, to the 'more info' cache
                moreInfoDataCache.set(coin.id, moreInfoDataObject);

                // creating a timeout of 2 minutes, indicating that in 2 minutes, get the data from the server
                setTimeout( () => {
                    moreInfoDataCache.delete(coin.id);
                }, 120000);

                // console.log("Got 'More Info' data From Server");

                // removing the loading animation right after we got the data from the server
                removeLoadingAnimation(coinCardContainer);
                
                // after we inserted the data from the server to the cache, get that data
                getMoreInfoDataFromCache(coin, coinCardContainer, moreInfoButton);
            })

            // in case our request has failed, alert the error status
            .catch( error => {
                alert(`Oops, Something went wrong, please try again. Status ${error.status}`);
            })
        }

        function getCoinsFromServer() {

            // displaying a loading animation, when getting the coins data from the server
            displayLoadingAnimation(mainSectionContainer);

            // making an Ajax 'GET' request for all the coins objects from the server
            $.get(allCoinsURL).then( coins => {

                // inserting the first 100 coins to the cache
                allCoinsCache = coins.slice(0, 100);

                // console.log("Got All Coins From Server");

                // displaying the coins in the UI, from the cache
                displayCoinsInUI(allCoinsCache);
            })

            // in case our request has failed, alert the error status
            .catch(error => {
                alert(`Oops, Something went wrong, please try again. Status ${error.status}`);
            });
        }

        function getMoreInfoDataFromCache(coin, coinCardContainer, moreInfoButton) {

            // retrieving the coin's 'more info' data object from the cache
            let clickedCoin = moreInfoDataCache.get(coin.id);

            // assigning a variable for the card container of the clicked coin
            let coinContainerCardBody = coinCardContainer.children().first();

            // displaying the 'more info' data from the cache
            displayCoinMoreInfoSectionFromCacheInUI(clickedCoin, coinContainerCardBody, moreInfoButton);
        }




        // -------------------- View -------------------- //

        function displayCoinsInUI(coinsToDisplay) {

            // clearing the main section, in order to display the new coins container section
            mainSectionContainer.empty();

            // creating the coins container for the coins to be displayed
            let coinsContainer = $("<div>");
            coinsContainer.addClass("coins-container");

            for (coin of coinsToDisplay) {

                // creating the new coin card with the coin data
                let newCoinCard = createNewCoinCard();
                let newCardBodySection = createNewCardBodySection();

                let newCoinNameParagraph = createNewCoinName(coin.name);
                let newCoinSymbolParagraph = createNewCoinSymbol(coin.symbol);
                let newCoinIDParagraph = createNewCoinID(coin.id);
                let newBottomCoinSection = createBottomCoinSection(coin, newCoinCard);

                // appending the newly created elements to the DOM
                newCardBodySection.append(newCoinNameParagraph);
                newCardBodySection.append(newCoinSymbolParagraph);
                newCardBodySection.append(newCoinIDParagraph);

                newCoinCard.append(newCardBodySection);
                newCoinCard.append(newBottomCoinSection);

                coinsContainer.append(newCoinCard);
            }

            // appending the coins container to the DOM
            mainSectionContainer.append(coinsContainer);
        }

        function createNewCoinCard() {

            // creating a card container for a single coin
            let coinCard = $("<div>");
            coinCard.addClass("coin-card");

            return coinCard;
        }

        function createNewCardBodySection() {

            // creating a container for the minor details on the card
            let cardBodySection = $("<div>");
            cardBodySection.addClass("card-body");

            return cardBodySection;
        }

        function createBottomCoinSection(coin, coinCardContainer) {

            // creating the bottom section of the card container
            let bottomCoinSection = $("<div>");
            bottomCoinSection.addClass("coin-bottom-section");


            // creating the 'more info' button inside the coin card container
            let moreInfoButton = createMoreInfoButton(coin, coinCardContainer);


            // creating the toggle button inside the coin card container
            let toggleBtnContainer = createToggleButton(coin);


            // appending the newly created elements
            bottomCoinSection.append(moreInfoButton);
            bottomCoinSection.append(toggleBtnContainer);


            // returning the entire bottom section card container
            return bottomCoinSection;
        }

        function createToggleButton(coin) {

            // creating the toggle button inside the coin card container
            let toggleBtnContainer = $("<label>");
            toggleBtnContainer.addClass("switch");

            let toggleBtn = $("<input>");
            toggleBtn.attr("type", "checkbox");
            toggleBtn.addClass("toggle-btn");

            let toggleBtnSlider = $("<span>");
            toggleBtnSlider.addClass("slider round");


            toggleBtnContainer.append(toggleBtn);
            toggleBtnContainer.append(toggleBtnSlider);


            // adding an event listener for the toggle button
            toggleBtn.click( () => {
                onCoinCardToggleButtonClick(coin, toggleBtn);
            });

            if (toggledButtonsStates.includes(coin.symbol)) {
                toggleBtn.attr("checked", "checked");
            }

            return toggleBtnContainer;
        }

        function createMoreInfoButton(coin, coinCardContainer) {

            // creating the 'more info' button inside the coin card container
            let moreInfoButton = $("<button>");
            moreInfoButton.addClass("custom-btn more-info-btn");
            moreInfoButton.text("More Info");


            // adding an event listener for the 'more info' button
            moreInfoButton.click( function() {

                // assigning a variable that holds the 'more info' data container
                let coinMoreInfoSection = coinCardContainer.children().first().children().last();

                // declaring a boolean variable, that holds the data about the button's clicks
                let clicks = $(this).data("clicks");
                
                // if the clicks indicator is true, remove the 'more info' data section
                if (clicks) {
                    moreInfoButton.text("More Info");
                    coinMoreInfoSection.remove();
                }

                // if the clicks indicator is false, create a new 'more info' section
                else {
                    moreInfoButton.text("Less Info");

                    // right before displaying the 'more info' section, disable the button so the user
                    // will not be able to press again, until the section has been added
                    moreInfoButton.attr("disabled", "disabled");
                    moreInfoButton.addClass("disabled-custom-btn");
                    onMoreInfoClick(coin, coinCardContainer, moreInfoButton);
                }

                // changing the state of our boolean variable that keeps track of the button's clicks
                $(this).data("clicks", !clicks);
            });

            return moreInfoButton;
        }

        function createNewCoinName(coinName) {

            // creating a coin name paragraph
            let coinNameParagraph = $("<p>");
            coinNameParagraph.addClass("coin-name");
            coinNameParagraph.text(coinName);

            return coinNameParagraph;
        }

        function createNewCoinSymbol(coinSymbol) {

            // creating a coin symbol paragraph
            let coinSymbolParagraph = $("<p>");
            coinSymbolParagraph.addClass("coin-symbol");
            coinSymbolParagraph.text(coinSymbol);

            return coinSymbolParagraph;
        }

        function createNewCoinID(coinID) {

            // creating a coin ID paragraph
            let coinIDParagraph = $("<p>");
            coinIDParagraph.addClass("coin-id");
            coinIDParagraph.text(coinID);

            return coinIDParagraph;
        }

        function createNewUSDparagraph(coinPriceInUSD) {
            let newUSDparagraph = $("<p>");
            newUSDparagraph.addClass("usdParagraph");

            let dollarSignImage = $("<img>");
            dollarSignImage.attr("src", "../assets/dollarSymbol.png");
            dollarSignImage.addClass("currency-symbol");

            newUSDparagraph.append(dollarSignImage);
            newUSDparagraph.append(coinPriceInUSD + " USD");

            return newUSDparagraph;
        }

        function createNewEURparagraph(coinPriceInEUR) {
            let newEURparagraph = $("<p>");
            newEURparagraph.addClass("usdParagraph");

            let euroSignImage = $("<img>");
            euroSignImage.attr("src", "../assets/euroSymbol.png");
            euroSignImage.addClass("currency-symbol");

            newEURparagraph.append(euroSignImage);
            newEURparagraph.append(coinPriceInEUR + " EUR");

            return newEURparagraph;
        }

        function createNewILSparagraph(coinPriceInILS) {
            let newILSparagraph = $("<p>");
            newILSparagraph.addClass("usdParagraph");

            let shekelSignImage = $("<img>");
            shekelSignImage.attr("src", "../assets/ilsSymbol.png");
            shekelSignImage.addClass("currency-symbol");

            newILSparagraph.append(shekelSignImage);
            newILSparagraph.append(coinPriceInILS + " ILS");

            return newILSparagraph;
        }

        function displayCoinMoreInfoSectionFromCacheInUI(clickedCoin, coinContainerCardBody, moreInfoButton) {

            let coinMoreInfoSection = $("<div>");
            coinMoreInfoSection.addClass("coin-more-info-section animated fadeIn");

            let newUSDparagraph = createNewUSDparagraph(clickedCoin.priceInUSD);
            let newEURparagraph = createNewEURparagraph(clickedCoin.priceInEUR);
            let newILSparagraph = createNewILSparagraph(clickedCoin.priceInILS);

            let newCoinImage = $("<img>");
            newCoinImage.attr("src", clickedCoin.imageURL);
            newCoinImage.addClass("coin-icon");

            coinMoreInfoSection.append(newUSDparagraph);
            coinMoreInfoSection.append(newEURparagraph);
            coinMoreInfoSection.append(newILSparagraph);
            coinMoreInfoSection.append(newCoinImage);

            // appending the 'more data' info section to the DOM
            coinContainerCardBody.append(coinMoreInfoSection);


            // after the 'more info' section has been added to the DOM, enable the button again
            moreInfoButton.removeAttr("disabled");
            moreInfoButton.removeClass("disabled-custom-btn");
        }

        function removeLoadingAnimation(coinCardContainer) {

            // removing the loading animation for the specific coin card
            coinCardContainer.children().first().children().last().remove();
        }
        
        function displayLoadingAnimation(loadingSection) {
            
            // creating the SVG animation
            let loadingSVG = `
                <svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" class="loading-image" width="200px" height="200px" viewBox="0 0 100 100" preserveAspectRatio="xMidYMid">
                    <g transform="rotate(32.3228 50 50)">
                        <animateTransform attributeName="transform" type="rotate" values="360 50 50;0 50 50" keyTimes="0;1" dur="1s" repeatCount="indefinite" calcMode="spline" keySplines="0.5 0 0.5 1" begin="-0.1s"></animateTransform>
                        <circle cx="50" cy="50" r="39.891" stroke="#6994b7" stroke-width="14.4" fill="none" stroke-dasharray="0 300">
                            <animate attributeName="stroke-dasharray" values="15 300;55.1413599195142 300;15 300" keyTimes="0;0.5;1" dur="1s" repeatCount="indefinite" calcMode="linear" keySplines="0 0.4 0.6 1;0.4 0 1 0.6" begin="-0.046s"></animate>
                        </circle>
                        <circle cx="50" cy="50" r="39.891" stroke="#eeeeee" stroke-width="7.2" fill="none" stroke-dasharray="0 300">
                            <animate attributeName="stroke-dasharray" values="15 300;55.1413599195142 300;15 300" keyTimes="0;0.5;1" dur="1s" repeatCount="indefinite" calcMode="linear" keySplines="0 0.4 0.6 1;0.4 0 1 0.6" begin="-0.046s"></animate>
                        </circle>
                        <circle cx="50" cy="50" r="32.771" stroke="#000000" stroke-width="1" fill="none" stroke-dasharray="0 300">
                            <animate attributeName="stroke-dasharray" values="15 300;45.299378454348094 300;15 300" keyTimes="0;0.5;1" dur="1s" repeatCount="indefinite" calcMode="linear" keySplines="0 0.4 0.6 1;0.4 0 1 0.6" begin="-0.046s"></animate>
                        </circle>
                        <circle cx="50" cy="50" r="47.171" stroke="#000000" stroke-width="1" fill="none" stroke-dasharray="0 300">
                            <animate attributeName="stroke-dasharray" values="15 300;66.03388996804073 300;15 300" keyTimes="0;0.5;1" dur="1s" repeatCount="indefinite" calcMode="linear" keySplines="0 0.4 0.6 1;0.4 0 1 0.6" begin="-0.046s"></animate>
                        </circle>
                    </g>
                    <g transform="rotate(72.7613 50 50)">
                        <animateTransform attributeName="transform" type="rotate" values="360 50 50;0 50 50" keyTimes="0;1" dur="1s" repeatCount="indefinite" calcMode="spline" keySplines="0.5 0 0.5 1"></animateTransform>
                        <path fill="#6994b7" stroke="#000000" d="M97.2,50.1c0,6.1-1.2,12.2-3.5,17.9l-13.3-5.4c1.6-3.9,2.4-8.2,2.4-12.4"></path>
                        <path fill="#eeeeee" d="M93.5,49.9c0,1.2,0,2.7-0.1,3.9l-0.4,3.6c-0.4,2-2.3,3.3-4.1,2.8l-0.2-0.1c-1.8-0.5-3.1-2.3-2.7-3.9l0.4-3 c0.1-1,0.1-2.3,0.1-3.3"></path>
                        <path fill="#6994b7" stroke="#000000" d="M85.4,62.7c-0.2,0.7-0.5,1.4-0.8,2.1c-0.3,0.7-0.6,1.4-0.9,2c-0.6,1.1-2,1.4-3.2,0.8c-1.1-0.7-1.7-2-1.2-2.9 c0.3-0.6,0.5-1.2,0.8-1.8c0.2-0.6,0.6-1.2,0.7-1.8"></path>
                        <path fill="#6994b7" stroke="#000000" d="M94.5,65.8c-0.3,0.9-0.7,1.7-1,2.6c-0.4,0.9-0.7,1.7-1.1,2.5c-0.7,1.4-2.3,1.9-3.4,1.3h0 c-1.1-0.7-1.5-2.2-0.9-3.4c0.4-0.8,0.7-1.5,1-2.3c0.3-0.8,0.7-1.5,0.9-2.3"></path>
                    </g>
                    <g transform="rotate(32.3228 50 50)">
                        <animateTransform attributeName="transform" type="rotate" values="360 50 50;0 50 50" keyTimes="0;1" dur="1s" repeatCount="indefinite" calcMode="spline" keySplines="0.5 0 0.5 1" begin="-0.1s"></animateTransform>
                        <path fill="#eeeeee" stroke="#000000" d="M86.9,35.3l-6,2.4c-0.4-1.2-1.1-2.4-1.7-3.5c-0.2-0.5,0.3-1.1,0.9-1C82.3,33.8,84.8,34.4,86.9,35.3z"></path>
                        <path fill="#eeeeee" stroke="#000000" d="M87.1,35.3l6-2.4c-0.6-1.7-1.5-3.3-2.3-4.9c-0.3-0.7-1.2-0.6-1.4,0.1C88.8,30.6,88.2,33,87.1,35.3z"></path>
                        <path fill="#6994b7" stroke="#000000" d="M82.8,50.1c0-3.4-0.5-6.8-1.6-10c-0.2-0.8-0.4-1.5-0.3-2.3c0.1-0.8,0.4-1.6,0.7-2.4c0.7-1.5,1.9-3.1,3.7-4l0,0 c1.8-0.9,3.7-1.1,5.6-0.3c0.9,0.4,1.7,1,2.4,1.8c0.7,0.8,1.3,1.7,1.7,2.8c1.5,4.6,2.2,9.5,2.3,14.4"></path>
                        <path fill="#eeeeee" d="M86.3,50.2l0-0.9l-0.1-0.9l-0.1-1.9c0-0.9,0.2-1.7,0.7-2.3c0.5-0.7,1.3-1.2,2.3-1.4l0.3,0 c0.9-0.2,1.9,0,2.6,0.6c0.7,0.5,1.3,1.4,1.4,2.4l0.2,2.2l0.1,1.1l0,1.1"></path>
                        <path fill="#ff9922" d="M93.2,34.6c0.1,0.4-0.3,0.8-0.9,1c-0.6,0.2-1.2,0.1-1.4-0.2c-0.1-0.3,0.3-0.8,0.9-1 C92.4,34.2,93,34.3,93.2,34.6z"></path>
                        <path fill="#ff9922" d="M81.9,38.7c0.1,0.3,0.7,0.3,1.3,0.1c0.6-0.2,1-0.6,0.9-0.9c-0.1-0.3-0.7-0.3-1.3-0.1 C82.2,38,81.8,38.4,81.9,38.7z"></path>
                        <path fill="#000000" d="M88.5,36.8c0.1,0.3-0.2,0.7-0.6,0.8c-0.5,0.2-0.9,0-1.1-0.3c-0.1-0.3,0.2-0.7,0.6-0.8C87.9,36.3,88.4,36.4,88.5,36.8z"></path>
                        <path stroke="#000000" d="M85.9,38.9c0.2,0.6,0.8,0.9,1.4,0.7c0.6-0.2,0.9-0.9,0.6-2.1c0.3,1.2,1,1.7,1.6,1.5c0.6-0.2,0.9-0.8,0.8-1.4"></path>
                        <path fill="#6994b7" stroke="#000000" d="M86.8,42.3l0.4,2.2c0.1,0.4,0.1,0.7,0.2,1.1l0.1,1.1c0.1,1.2-0.9,2.3-2.2,2.3c-1.3,0-2.5-0.8-2.5-1.9l-0.1-1 c0-0.3-0.1-0.6-0.2-1l-0.3-1.9"></path>
                        <path fill="#6994b7" stroke="#000000" d="M96.2,40.3l0.5,2.7c0.1,0.5,0.2,0.9,0.2,1.4l0.1,1.4c0.1,1.5-0.9,2.8-2.2,2.9h0c-1.3,0-2.5-1.1-2.6-2.4 L92.1,45c0-0.4-0.1-0.8-0.2-1.2l-0.4-2.5"></path>
                        <path fill="#000000" d="M91.1,34.1c0.3,0.7,0,1.4-0.7,1.6c-0.6,0.2-1.3-0.1-1.6-0.7c-0.2-0.6,0-1.4,0.7-1.6C90.1,33.1,90.8,33.5,91.1,34.1z"></path>
                        <path fill="#000000" d="M85.5,36.3c0.2,0.6-0.1,1.2-0.7,1.5c-0.6,0.2-1.3,0-1.5-0.6C83,36.7,83.4,36,84,35.8C84.6,35.5,85.3,35.7,85.5,36.3z"></path>
                    </g>
                </svg>`;

            loadingSection.append(loadingSVG);
        }

        function clearModalContent() {
            let modalFooter = $(".modal-footer");
            let listOfCoinsInModal = $(".list-of-coins-in-modal");

            listOfCoinsInModal.empty();
            modalFooter.empty();
        }

        function displayModal(coin) {

            let toggledButtonsStatesBeforeModal =  toggledButtonsStates.slice();
            let selectedCoinsToDisplayBeforeModal = selectedCoinsToDisplay.slice();

            // displaying the modal
            let modal = $("#myModal");

            // if the modal is not displayed already
            // this validation is made in order to not re-draw the modal over and over with every click on the toggle button
            if (modal.css("display") !== "block") {

                // display the modal
                modal.css("display", "block");
                let modalFooter = $(".modal-footer");

                clearModalContent();

                for (coin of selectedCoinsToDisplay) {
                    addCoinCardToModal(coin);
                }

                let closeBtn = createModalCloseButton();
                let saveChangesBtn = createModalSaveChangesButton();

                modalFooter.append(closeBtn);
                modalFooter.append(saveChangesBtn);


                // setting the event listeners for the buttons
                setModalEventListeners(modal, saveChangesBtn, closeBtn, toggledButtonsStatesBeforeModal, selectedCoinsToDisplayBeforeModal);
            }
        }

        function createModalCloseButton() {
            let closeBtn = $("<span>");
            closeBtn.text("Close");
            closeBtn.addClass("close custom-btn");

            return closeBtn;
        }

        function createModalSaveChangesButton() {
            let saveChangesBtn = $("<span>");
            saveChangesBtn.text("Save Changes");
            saveChangesBtn.addClass("saveChangesBtn custom-btn");

            return saveChangesBtn;
        }

        function onModalClose(coin, modal, toggledButtonsStatesBeforeModal, selectedCoinsToDisplayBeforeModal) {

            // assigning the old states to the coin cards (not saving the new states)
            toggledButtonsStates = toggledButtonsStatesBeforeModal;
            selectedCoinsToDisplay = selectedCoinsToDisplayBeforeModal;

            alert("Changes Were not Saved !");

            modal.css("display", "none");
            clearModalContent();
            removeSpecificSelectedCoin(coin);

            // displaying the home screen in order to re-draw the new states of the coin cards
            displayHomeSection();
        }

        function addCoinCardToModal(coin) {

            let listOfCoinsInModal = $(".list-of-coins-in-modal");

            // creating the new coin card container with the coin data
            let newCoinCard = createNewCoinCard();
            newCoinCard.addClass("modal-list-coin-card");

            let newCardBodySection = createNewCardBodySection();

            let newCoinNameParagraph = createNewCoinName(coin.name);
            let newCoinSymbolParagraph = createNewCoinSymbol(coin.symbol);
            let newCoinIDParagraph = createNewCoinID(coin.id);
            let newBottomCoinSection = createBottomCoinSection(coin, newCoinCard);


            // appending the newly created elements to the DOM, to be displayed
            newCardBodySection.append(newCoinNameParagraph);
            newCardBodySection.append(newCoinSymbolParagraph);
            newCardBodySection.append(newCoinIDParagraph);

            newCoinCard.append(newCardBodySection);
            newCoinCard.append(newBottomCoinSection);

            listOfCoinsInModal.append(newCoinCard);
        }
        
        function displayHomeSection() {

            clearMainSectionContainer();

            // stopping the graph from getting data after the user left the page (stopping the GET request to the server)
            clearInterval(getPricesDataInterval);

            checkIfCoinsExistInCache();
        }

        function displayLiveReportsSection() {
            
            clearMainSectionContainer();

            // creating the 'live reports' section
            let liveReportsSection = $("<div>");
            liveReportsSection.addClass("live-reports-section");

            mainSectionContainer.append(liveReportsSection);


            // if we have chosen at least 1 coin to display on the 'Live Reports' section
            if (selectedCoinsToDisplay.length > 0) {
                displayLiveReportsGraph(liveReportsSection);
            }

            else {

                // displaying an image that indicates the user hasn't selected any coins to display.
                let noMoneyImage = $("<img>");
                noMoneyImage.addClass("no-money-image");
                noMoneyImage.attr("src", "../assets/noMoneyImage2.png");

                // appending the image to the DOM.
                liveReportsSection.append(noMoneyImage);
            }
        }

        function displayLiveReportsGraph(liveReportsSection) {

            // here, I am using the array "map" method, in order to create a new array that puts
            // a SPACE character before each coin, in order to display the title of the coins properly in the graph.
            let selectedCoinsSymbolsTitle = selectedCoinsToDisplay.slice("").map( coin => " " + coin.symbol );

            // creating the URL for the prices in USD.
            let selectedCoinsSymbols = selectedCoinsToDisplay.slice("").map( coin => coin.symbol );
            let URLofSelectedCoinsValuesInUSD = `https://min-api.cryptocompare.com/data/pricemulti?fsyms=${selectedCoinsSymbols}&tsyms=USD`;




            // -------------------- The code for the graph library -------------------- //

            let options = {
                exportEnabled: true,
                animationEnabled: false,
                title:{
                    text: selectedCoinsSymbolsTitle + " To USD"
                },
                subtitles: [{
                    text: "Click a Coin Color Below to Hide or Unhide Data"
                }],
                axisX: {
                    title: "",
                },
                axisY: {
                    title: "Coin Value",
                    titleFontColor: "#4F81BC",
                    lineColor: "#4F81BC",
                    labelFontColor: "#4F81BC",
                    tickColor: "#4F81BC",
                    includeZero: false
                },
                axisY2: {
                    title: "Profit in USD",
                    titleFontColor: "#C0504E",
                    lineColor: "#C0504E",
                    labelFontColor: "#C0504E",
                    tickColor: "#C0504E",
                    includeZero: false
                },
                toolTip: {
                    shared: true
                },
                legend: {
                    cursor: "pointer",
                    itemclick: toggleDataSeries
                },
                data: [
                    {
                        type: "spline",
                        name: selectedCoinsSymbolsTitle[0],
                        showInLegend: true,
                        xValueFormatString: "MMM YYYY",
                        yValueFormatString: "#,##0 USD",
                        dataPoints: [
                        ]
                    },
                    {
                        type: "spline",
                        name: selectedCoinsSymbolsTitle[1],
                        showInLegend: true,
                        xValueFormatString: "MMM YYYY",
                        yValueFormatString: "#,##0 USD",
                        dataPoints: [
                        ]
                    },
                    {
                        type: "spline",
                        name: selectedCoinsSymbolsTitle[2],
                        showInLegend: true,
                        xValueFormatString: "MMM YYYY",
                        yValueFormatString: "#,##0 USD",
                        dataPoints: [
                        ]
                    },
                    {
                        type: "spline",
                        name: selectedCoinsSymbolsTitle[3],
                        showInLegend: true,
                        xValueFormatString: "MMM YYYY",
                        yValueFormatString: "#,##0 USD",
                        dataPoints: [
                        ]
                    },
                    {
                        type: "spline",
                        name: selectedCoinsSymbolsTitle[4],
                        showInLegend: true,
                        xValueFormatString: "MMM YYYY",
                        yValueFormatString: "#,##0 USD",
                        dataPoints: [
                        ]
                    }
                ]
            };

            function toggleDataSeries(e) {
                if (typeof (e.dataSeries.visible) === "undefined" || e.dataSeries.visible) {
                    e.dataSeries.visible = false;
                } else {
                    e.dataSeries.visible = true;
                }
                e.chart.render();
            }

            // -------------------- END of the code for the graph library -------------------- //




            // calling a function that gets the data from the URL, based on the coins selected
            getPricesDataFromURL(options, URLofSelectedCoinsValuesInUSD, liveReportsSection);


            // setting an interval function, to get the data from the server, and update the graph for
            // the selecetd coins. occurs every 2 seconds.
            getPricesDataInterval = setInterval(() => {
                getPricesDataFromURL(options, URLofSelectedCoinsValuesInUSD, liveReportsSection);
            }, 2000);

        }

        function displayAboutSection() {

            clearMainSectionContainer();

            // stopping the graph from getting data after the user left the page (stopping the GET request to the server)
            clearInterval(getPricesDataInterval);

            aboutSection.css("display", "block");
            mainSectionContainer.append(aboutSection);
        }

        function clearMainSectionContainer() {

            // clearing all the childs of the main section
            mainSectionContainer.empty();
        }

        function clearSearchInputField() {
            const searchInput = $("#searchCoinsInput");
            searchInput.val("");
        }




        // -------------------- Controller -------------------- //

        function checkIfCoinsExistInCache() {

            // checking if our 'all coins' cache is empty. If so, get the coins from the server
            if (allCoinsCache.length === 0) {
                getCoinsFromServer();
            }

            // if our cache is not empty, display the coins from the cache
            else {
                displayCoinsInUI(allCoinsCache);
            }
        }

        function onMoreInfoClick(coin, coinCardContainer, moreInfoButton) {
            
            // checks whether the clicked coin's 'more info' data is stored in the cache
            checkIfMoreInfoDataExistInCache(coin, coinCardContainer, moreInfoButton);
        }

        function checkIfMoreInfoDataExistInCache(coin, coinCardContainer, moreInfoButton) {

            // defining the new URL, based on the coin that was clicked
            const clickedCoinURL = DOMAIN + `/api/v3/coins/${coin.id}`;

            // if the clicked coin's 'more info' data exists in the cache, get it from the cache
            if (moreInfoDataCache.has(coin.id)) {

                //get the 'more info' data of the specific coin, from the cache
                getMoreInfoDataFromCache(coin, coinCardContainer, moreInfoButton);
            }

            // if the clicked coin's 'more info' data does NOT exist in the cache, get it from the server
            else {

                //get the 'more info' data of the specific coin, from the server
                getMoreInfoDataFromServer(clickedCoinURL, coinCardContainer, coin, moreInfoButton);
            }
        }

        function addCoinToSelectedList(coin) {

            // adding the coin to the 'toggled' list
            toggledButtonsStates.push(coin.symbol);

            // adding the coin to the 'selected coins to display' list
            selectedCoinsToDisplay.push(coin);
        }

        function selectedCoinsValidation(coin) {

            if (selectedCoinsToDisplay.length <= maxNumberOfSelectedCoinsAllowed) {
                addCoinToSelectedList(coin);
            }

            if (selectedCoinsToDisplay.length > maxNumberOfSelectedCoinsAllowed) {
                onTooManyCoinsSelected(coin);
            }
        }

        function setModalEventListeners(modal, saveChangesBtn, closeBtn, toggledButtonsStatesBeforeModal, selectedCoinsToDisplayBeforeModal) {
            saveChangesBtn.mouseover( () => {
                if (selectedCoinsToDisplay.length > maxNumberOfSelectedCoinsAllowed) {
                    saveChangesBtn.addClass("disabled-custom-span");
                }

                else {
                    saveChangesBtn.removeClass("disabled-custom-span");
                }
            });

            saveChangesBtn.click( () => {

                // if the user selected less coins than the max allowed
                if (selectedCoinsToDisplay.length < maxNumberOfSelectedCoinsAllowed + 1) {
                    modal.css("display", "none");
                    displayHomeSection();
                    clearModalContent();
                }
            });

            closeBtn.click( () => {

                onModalClose(coin, modal, toggledButtonsStatesBeforeModal, selectedCoinsToDisplayBeforeModal);
            });
            
            // When the user clicks anywhere outside of the modal
            window.onclick = function(event) {
                if (event.target.id == "myModal") {

                    onModalClose(coin, modal, toggledButtonsStatesBeforeModal, selectedCoinsToDisplayBeforeModal);
                }
            };
        }

        function getPricesDataFromURL(options, URLofSelectedCoinsValuesInUSD, liveReportsSection) {

            // making an Ajax 'GET' request to the server, to get the coins values in USD, in order
            // to display that data in the graph.
            $.get(URLofSelectedCoinsValuesInUSD).then( currentCoinData => {

                // defining an index to keep track of the data object property (black box of the graph library).
                let indexOfDataPoint = 0;

                for (let coin in currentCoinData) {

                    // updating the graph with the new data retrieved from the server
                    options.data[indexOfDataPoint].dataPoints.push({x: new Date(), y: currentCoinData[coin].USD});
                    indexOfDataPoint ++;
                }


                // rendering the graph with the new data retrieved from the server
                liveReportsSection.CanvasJSChart(options);
            })

            // in case our request to the server has failed, alert an error status.
            .catch( error => {
                alert(`Oops, Something went wrong, please try again. Status ${error.status}`);
            })
        }

        function onCoinCardToggleButtonClick(coin, toggleBtn) {

            // if the toggle button the user pressed is checked
            if ($(toggleBtn).is(":checked")) {
                
                $(toggleBtn).attr("checked", "checked");

                // validate that the number of selected coins, and handle properly
                selectedCoinsValidation(coin);
            }

            else {

                // removing the "checked" attribute from the toggled button
                $(toggleBtn).removeAttr("checked");

                // removing the coin that was toggled off, from the 'selected coins' set
                removeSpecificSelectedCoin(coin);
            }
        }

        function removeSpecificSelectedCoin(coin) {

            // removing the coin's 'toggled' state from the toggled buttons set
            let indexOfCoin = toggledButtonsStates.indexOf(coin.symbol);
            toggledButtonsStates.splice(indexOfCoin, 1);

            // removing the coin from the 'selected coins to display' set
            let indexOfSelectedCoin = selectedCoinsToDisplay.indexOf(coin);
            selectedCoinsToDisplay.splice(indexOfSelectedCoin, 1);
        }

        function onTooManyCoinsSelected(coin) {
            displayModal(coin);
        }

        function inputFieldValidation() {

            // defining the search input field
            const searchInput = $("#searchCoinsInput");
            let searchInputValue = searchInput.val();
            let searchInputValueTrimmed = searchInputValue.trim();

            if (searchInputValueTrimmed !== "") {
                getSearchedCoinsFromCache(searchInputValueTrimmed);
            }
        }

        function getSearchedCoinsFromCache(searchInputValueTrimmed) {

            // defining an array which holds the filtered results from the cache, based on the user's search value
            let coinsSearchedByTheUser = allCoinsCache.filter( coin => coin.symbol === searchInputValueTrimmed );

            clearMainSectionContainer();
            clearSearchInputField();

            // if no results were found
            if (coinsSearchedByTheUser.length === 0) {

                // creating an image that indicates that no results were found
                let resultsNotFoundImage = $("<img>");
                resultsNotFoundImage.addClass("no-results-found-image");
                resultsNotFoundImage.attr("src", "../assets/noResultsFound.png");

                mainSectionContainer.append(resultsNotFoundImage);
            }

            else {
                displayCoinsInUI(coinsSearchedByTheUser);
            }
        }

        function onSearchBtnHover() {

            // defining the search input field
            const searchInput = $("#searchCoinsInput");
            let searchInputValue = searchInput.val();
            let searchInputValueTrimmed = searchInputValue.trim();


            // if the input field is empty
            if (searchInputValueTrimmed === "") {
                searchCoinsBtn.addClass("disabled-custom-span");
            }

            else {
                searchCoinsBtn.removeClass("disabled-custom-span");
            }
        }

        
    });

})();