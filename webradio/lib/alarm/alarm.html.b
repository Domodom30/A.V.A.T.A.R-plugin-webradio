<!DOCTYPE html>
<html>

<head>
    <meta charset="UTF-8">
    <meta http-equiv="Content-Security-Policy"
        content="default-src 'self'; script-src 'self' ; style-src 'self' 'unsafe-inline'">
    <meta http-equiv="X-Content-Security-Policy" content="default-src 'self'; script-src 'self'" />

    <script src="../../../../../node_modules/xel/xel.js" type="module"></script>
    <meta name="xel-theme" content="">
    <meta name="xel-accent-color" content="">
    <meta name="xel-icons" content="">

    <link href="../../../../../assets/html/css/base.css" rel="stylesheet" type="text/css" />
</head>

<body>


    <x-label id="window-title" class="x-label-title"></x-label>
    <form id="cronForm">
        <x-card id="xcard-alarm">
            <x-box>
                <x-label for="time" id="label-time"></x-label>
                <x-input type="time" id="time" required></x-input>
            </x-box>

            <x-box>
                <x-label class="max-width-150" id="label-days"></x-label>
            </x-box>
            <x-box id="check-days"></x-box>
        </x-card>
    </form>
    <x-box class="footer">
        <x-buttons class="footer-buttons">
            <x-button id="save" size="small" class="button-success">
                <x-icon href='#edit'></x-icon>
                <x-label id="label-save"></x-label>
            </x-button>
            <x-button id="quit" size="small" class="button-close">
                <x-icon href='#logout'></x-icon>
                <x-label id="label-quit"></x-label>
            </x-button>
        </x-buttons>
    </x-box>

    <x-notification id="notification" timeout="2500"></x-notification>
    <script src="./alarm-renderer.js"></script>
</body>

</html>