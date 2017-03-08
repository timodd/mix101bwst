loadAPI(2);

// unstable behaviour of LEDs (Fedora25, BW2.0 Beta6) after saving the script
//you have to restart the script or even un/replug the Mix-101 and detect the controller again to make the LEDs work again
//avoid sending wrong MIDI msg could help

host.defineController("DJ-Tech","MIX-101","1.0","82ae50a0-6741-11e2-bced-0800230c9a66","71modd");
host.defineMidiPorts(1,1);
host.addDeviceNameBasedDiscoveryPair(["Mix-101"],["Mix-101"]);
host.addDeviceNameBasedDiscoveryPair(["Mix-101 MIDI 1"],["Mix-101 MIDI 1"]);
host.addDeviceNameBasedDiscoveryPair(["Mix-101 MIDI 2"],["Mix-101 MIDI 2"]);

var NUM_SENDS = 3;
var NUM_TRACKS = 2;
var NUM_SLOTS = 1;

// CCs (status=176)
var left = [42,40,38,36,33]; // 0=low, 1=mid, 2=hi, 3=gain, 4=fader
var right = [43,41,39,37,34];// 
var left0 = [84,82,80];
var right0 = [85,83,81];
var cross = 35;
var enc = [16,17,18];
var dial = 19;

// NOTEs (status=144)
var pfl = [1,2];
var enc_press = [11,12,13];
var button1 = 3;
var button2 = 4;
var ab = 9;
var cue = 8;
var play = 7;
var sync = 6;
var select = 5;

var mode = [17,18,19,20];// 0=sampler, 1=loop, 2=fx, 3=cue/vinyl
var led = [1,2,3,4,17,18,19,20,9,10,8,7];

var isA = true;
var isShift = 0;

function init()
{
   // midi in port for the communication from sw to hw
   host.getMidiInPort(0).setMidiCallback(onMidi);
//   host.getMidiInPort(0).setSysexCallback(onSysex);

   // println(host.getHostApiVersion());

   // all the needed sections are created here
   application = host.createApplication();
   // cursorTrack = host.createArrangerCursorTrack(2,0);
   tracks1u2 = host.createMainTrackBank(NUM_TRACKS,NUM_SENDS,NUM_SLOTS);
   devBankA = tracks1u2.getChannel(0).createDeviceBank(7);
   devBankB = tracks1u2.getChannel(1).createDeviceBank(7);
   deviceA1 = devBankA.getDevice(1).createCursorRemoteControlsPage(4);
   deviceB1 = devBankB.getDevice(1).createCursorRemoteControlsPage(4);
   deviceA2 = devBankA.getDevice(2).createCursorRemoteControlsPage(3); /**TODO**/
   deviceB2 = devBankB.getDevice(2).createCursorRemoteControlsPage(3); /**TODO**/
   trackBank = host.createMainTrackBank(NUM_TRACKS,NUM_SENDS,NUM_SLOTS);
   trackBank.setChannelScrollStepSize(2);
   trackBank.scrollChannelsUp();
   transport = host.createTransport();
//   initLeds();

   for (var j = 0; j < 3; j++)
   {
      deviceA1.getParameter(j).getAmount().setIndication(true);
      deviceB1.getParameter(j).getAmount().setIndication(true);
   }
   tracks1u2.getChannel(0).getVolume().setIndication(true);
   tracks1u2.getChannel(1).getVolume().setIndication(true);
   trackBank.getChannel(0).getClipLauncherSlots().setIndication(true);
   trackBank.getChannel(1).getClipLauncherSlots().setIndication(true);

   tracks1u2.getChannel(0).getSolo().addValueObserver(function(state)
   {
      sendNoteOn(0,1,state ? 127 : 0);
   });
   tracks1u2.getChannel(1).getSolo().addValueObserver(function(state)
   {
      sendNoteOn(0,2,state ? 127 : 0);
   });
}
function onMidi(status, data1, data2)
{
    printMidi(status, data1, data2);
   if (isChannelController(status))
   {
      var i = -1;
      if (left.indexOf(data1) >= 0)
      {
         i = left.indexOf(data1);
         if (i < 3)
         {
            deviceA1.getParameter(i).getAmount().set(data2,128);
         }
         else if (i == 3)
         {

         }
         else if (i == 4)
         {

            tracks1u2.getChannel(0).getVolume().set(data2,128);
         }
      }
      if (right.indexOf(data1) >= 0)
      {
         i = right.indexOf(data1);
         if (i < 3)
         {
            deviceB1.getParameter(i).getAmount().set(data2,128);
         }
         else if (i == 3)
         {

         }
         else if (i == 4)
         {
            tracks1u2.getChannel(1).getVolume().set(data2,128);
         }
      }
      if (enc.indexOf(data1) >= 0)
      {
         i = enc.indexOf(data1);
         if (isA)
         {
           // rotaries send 63 on left, 65 on right turn
           deviceA2.getParameter(i).getAmount().inc(data2-64,64); // 128 for full range
         }
         else
         {
           deviceB2.getParameter(i).getAmount().inc(data2-64,64); // 128 for full range
         }
      }
      if (data1 == cross)
      {
         data2 == 64 ? transport.getCrossfade().reset() : transport.getCrossfade().set(data2,128);
         // if (data2 < 32)
         // {
         // trackBank.scrollToChannel(2);
         // }
         // else if (data2 >= 32 && data2 <= 97)
         // {
         // trackBank.scrollToChannel(4);
         // }
         // else if (data2 > 97)
         // {
         // trackBank.scrollToChannel(6);
         // }
      }
      if (data1 == dial)
      {
        if (isShift)
           data2 < 64 ? trackBank.scrollScenesUp() : trackBank.scrollScenesDown();
      }
   }
   if (isNoteOn(status))
   {
      var i = 0;
      if (pfl.indexOf(data1) >= 0 && data2 > 0)
      {
         i = pfl.indexOf(data1);
         tracks1u2.getTrack(i).getSolo().toggle();
      }
      if (left0.indexOf(data1) >= 0)
      {
         i = left0.indexOf(data1);
         deviceA1.getParameter(i).getAmount().reset();
      }
      if (right0.indexOf(data1) >= 0)
      {
         i = right0.indexOf(data1);
         deviceB1.getParameter(i).getAmount().reset();
      }
      if (data1 == play && data2)
      {
//         transport.play();
         trackBank.launchScene(0);
         trackBank.scrollScenesDown();
      }
      if (data1 == sync)
      {
         isShift = data2;
      }

      if (data1 == ab && data2)
      {
         switchAB();
         for (var j = 0; j < 3; j++)
         {
         deviceA2.getParameter(j).getAmount().setIndication(isA);
         deviceB2.getParameter(j).getAmount().setIndication(!isA);
         }
      }
   }
}

//function onSysex(data)
//{
//   printSysex(data);
//}

var initLeds = function()
{
   for (var i = 0x01; i < 0x09; i++)
   {
      sendNoteOn(0,i,0);
   }
}

var setLED = function(index,state)
{
        sendNoteOn(0,led[index],state);
}

var switchAB = function()
{
   if (isA)
   {
      setLED(9,127);
//      setLED(8,0);
      isA = false;

   }
   else
   {
      setLED(8,127);
//      setLED(9,0);
//      host.scheduleTask(setLED(9,0),null,5);
      isA = true;
   }
}


