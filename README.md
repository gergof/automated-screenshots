# automated-screenshots

[![Build Status](https://ci.systest.eu/api/badges/gergof/automated-screenshots/status.svg?ref=refs/heads/main)](https://ci.systest.eu/gergof/automated-screenshots)
[![NPM Version](https://img.shields.io/npm/v/automated-screenshots)](https://www.npmjs.com/package/automated-screenshots)
[![License](https://img.shields.io/npm/l/automated-screenshots)](https://www.gnu.org/licenses/gpl-3.0.html)
[![Typescript](https://img.shields.io/npm/types/automated-screenshots)](https://www.typescriptlang.org/)
[![Chat](https://img.shields.io/matrix/automated-screenshots:systemtest.tk)](https://matrix.to/#/#automated-screenshots:systemtest.tk)

Automate taking screenshots of your application and control it directly from inside from your application. Supports taking screenshots from web browsers, android emulators and ios simulators.

### Why?

Have you ever faced the problem that you have to take a lot of screenshots of your app for some marketing material?

It can quickly get annoying that you have to repeat the same steps over and over on many platforms and devices. So the solution is self explanatory: automate it!

For mobile apps for example you can use fastlane. The only problem is that these tools are not aware of your application. If you're using React Native for example you can not use the traditional UI tests to navigate around your app. This is where **automated-screenshots** comes into play.

**Automated-screenshots** follows a different method: it only provides a host software that starts and stops the agents (more about them later) and takes the screenshots, but the rest of the job (the navigation and clicking part) is leveraged to the actual application.

Your app runs a client that connects to automated-screenshots via websocket and navigates around the app.

### How it works

##### Agents

Agents are pluggable modules that can manage the starting and stopping of your application and can take the screenshots. Currently we support android and ios agents and there's a planned agent for puppeteer.

##### Clients

Clients are libraries that are installed inside your application to navigate around it. Currently we only have one client for javascript: [automated-screenshots-client](https://github.com/gergof/automated-screenshots-client).

### Get started!

1. **Install automated-screenshots**

    ```bash
    npm install --save-dev automated-screenshots
    ```

2. **Create a configuration file**

    You can use either json or yml. You can see some examples in the [examples folder](https://github.com/gergof/automated-screenshots/tree/main/examples).

    ```yml
    # screenshots.yml
    port: 8700 # the port on which the websocket will run on
    agents:
        - type: android
          startAppCommand: npm run android
          startAppTimeout: 90000 # in milliseconds
          output: screenshots
          paths:
              adb: ~/Android/platform-tools/adb
              emulator: ~/Android/emulator/emulator
              sdkManager: ~/Android/cmdline-tools/latest/bin/sdkmanager
              avdManager: ~/Android/cmdline-tools/latest/bin/avdmanager
          devices:
              - pixel_4;29
              - pixel_c;26
    ```

3. **Install automated-screenshots-client inside your app**

    Please refer to [this](https://github.com/gergof/automated-screenshots-client) to set it up.

4. **Start automated-screenshots server**

    ```bash
    npm run automated-screenshots -c screenshots.yml
    ```

### Agents

#### Android

##### Config

```yml
type: android
output: 'folder for the screenshots'
startAppCommand: 'command to execute to start your application'
startAppTimeout: 'wait this much for your application to start'

paths:
    adb: 'adb executable'
    emulator: 'emulator executable'
    sdkManager: 'SDK Manager executable'
    avdManager: 'AVD Manager executable'
devices:
    - '<device_name>;<api_version>'
time: 1234 # unix timestamp to set the clock on
clearNotifications: true # clear notifications before taking a screenshot
```

##### Usage

This agent will spin up android emulators and take screenshots on each of them.

You have to install the Android SDK (we need the platform-tools, cmdline-tools and emulator) for yourself. Please refer to [this](https://developer.android.com/studio/command-line).

The devices themself are installed automatically by the agent.

The devices are represented by a string with a single semicolon in them. The _device_name_ part defines the actual device (you can get the list of supported devices by running `avdmanager list devices`) and the second part is the API level (you can use [this table](https://source.android.com/setup/start/build-numbers) to find out which api level corresponds to which android version). Example: `pixel_4;29`

The keyboard is automatically dismissed before taking a screenshot and you can configure a unix timestamp which will be used to set the clock. You can also set if you want your notifications dismissed before taking screenshots.

You don't have to worry about forwarding the port of the websocket server. We will also disable android setup as a bonus (so you can get rid of that ugly gear from your precious screenshots).

#### IOS

##### Config

```yml
type: ios
output: 'folder for the screenshots'
startAppCommand: 'command to execute to start your application'
startAppTimeout: 'wait this much for your application to start'

devices:
    - '<device_name>;<runtime>'
time: 1234 # unix timestamp to set the clock on
```

##### Usage

This agent will spin up ios simulators and takes screenshots on each of them.

You need to have XCode and XCode CLI tools installed and you also need to install the required runtimes.

The devices are represented by a string with a single semicolon in them. The first part defines the device (you can get the list of the supported ones by running `xcrun simctl list devicetypes`. You need the string that starts like _com.apple._) and the second part is the runtime (you can get the supported runtimes by running `xcrun simctl list runtimes`). Example: `com.apple.CoreSimulator.SimDeviceType.iPhone-7;com.apple.CoreSimulator.SimRuntime.iOS-14-0`.

### Command line reference

```
Usage: automated-screenshots [options]

Take automated screenshots using different agents

Options:
  -v, --version                  output the version number
  -c, --config <file>            configuration file in json or yml
  -a, --agents <agent types...>  only run the specified agent types
  -h, --help                     display help for command
```

### Need help?

If you have any questions feel free to contact me using Matrix on [#automated-screenshots:systemtest.tk](https://matrix.to/#/#automated-screenshots:systemtest.tk).

### Roadmap

-   [ ] Add web agent using puppeteer
-   [ ] Allow clients to execute adb/simctl/puppeteer commands
-   [ ] Better handling of errors
