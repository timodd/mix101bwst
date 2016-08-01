loadAPI(1);

host.defineController("DJ-Tech","MIX-101","1.0","82ae50a0-6741-11e2-bced-0800230c9a66");
host.addDeviceNameBasedDiscoveryPair(["Mix-101"],["Mix-101"]);
host.defineMidiPorts(1,1);

var NUM_SENDS = 3;
var NUM_TRACKS = 2;
var NUM_SLOTS = 1;

// CCs (status=176)
var left = [42,40,38,36,33]; // 0=low, 1=mid, 2=hi, 3=gain, 4=fader
var right = [43,41,39,37,34];// 
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

function init()
{
   // midi in port for the communication from sw to hw
   host.getMidiInPort(0).setMidiCallback(onMidi);
   host.getMidiInPort(0).setSysexCallback(onSysex);

   // println(host.getHostApiVersion());

   // all the needed sections are created here
   application = host.createApplication();
   // cursorTrack = host.createArrangerCursorTrack(2,0);
   tracks1u2 = host.createMainTrackBank(NUM_TRACKS,NUM_SENDS,NUM_SLOTS);
   deviceA = tracks1u2.getChannel(0).createDeviceBank(1);
   deviceB = tracks1u2.getChannel(1).createDeviceBank(1);
   // deviceA = tracks1u2.getChannel(0).createCursorDevice("A");
   // deviceA = cursorTrack.createCursorDevice("A");
   // deviceA = tracks1u2.getChannel(0).getPrimaryDevice();
   trackBank = host.createMainTrackBank(NUM_TRACKS,NUM_SENDS,NUM_SLOTS);
   trackBank.setChannelScrollStepSize(2);
   trackBank.scrollChannelsUp();
   transport = host.createTransport();
   initLeds();

   for (var j = 0; j < 3; j++)
   {
      deviceA.getDevice(0).getMacro(j).getAmount().setIndication(true);
      deviceB.getDevice(0).getMacro(j).getAmount().setIndication(true);
//      deviceA.getMacro(j).getAmount().setIndication(true);
      // deviceB.getParameter(j).setIndication(true);
      // tracks1u2.getChannel(1).getPrimaryDevice().getParameter(j).setIndication(true);
   }
   tracks1u2.getChannel(0).getVolume().setIndication(true);
   tracks1u2.getChannel(1).getVolume().setIndication(true);
   trackBank.getChannel(0).getClipLauncherSlots().setIndication(true);
   trackBank.getChannel(1).getClipLauncherSlots().setIndication(true);

   tracks1u2.getChannel(0).getSolo().addValueObserver(function(state)
   {
      sendNoteOn(0,1,state ? 127 : 0)
   });
   tracks1u2.getChannel(1).getSolo().addValueObserver(function(state)
   {
      sendNoteOn(0,2,state ? 127 : 0)
   });
}
function onMidi(status, data1, data2)
{
   // printMidi(status, data1, data2);
   if (isChannelController(status))
   {
      var i = -1;
      if (left.indexOf(data1) >= 0)
      {
         i = left.indexOf(data1);
         if (i < 3)
         {
            deviceA.getDevice(0).getMacro(i).getAmount().set(data2,128);
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
            deviceB.getDevice(0).getMacro(i).getAmount().set(data2,128);
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

      }
      if (data1 == cross)
      {
         transport.getCrossfade().set(data2,128);
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
   }
   if (isNoteOn(status))
   {
      if (pfl.indexOf(data1) >= 0 && data2 > 0)
      {
         var i = pfl.indexOf(data1);
         tracks1u2.getTrack(i).getSolo().toggle();
      }
   }
}

function onSysex(data)
{
   printSysex(data);
}

var initLeds = function()
{
   for (var i = 0; i < 12; i++)
   {
      sendNoteOn(144,led[i],0);
   }
}