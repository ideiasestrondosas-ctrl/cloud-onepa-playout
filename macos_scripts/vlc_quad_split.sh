#!/bin/bash

# Verifica se VLC existe
VLC_APP="/Applications/VLC.app"
if [ ! -d "$VLC_APP" ]; then
  echo "VLC não encontrado em /Applications"
  exit 1
fi

# Verifica número de argumentos
if [ "$#" -ne 4 ]; then
  echo "Uso: $0 <url1> <url2> <url3> <url4>"
  exit 1
fi

URL1=$1
URL2=$2
URL3=$3
URL4=$4

# Obter resolução do ecrã
SCREEN_WIDTH=$(system_profiler SPDisplaysDataType | grep Resolution | head -1 | awk '{print $2}')
SCREEN_HEIGHT=$(system_profiler SPDisplaysDataType | grep Resolution | head -1 | awk '{print $4}')

HALF_WIDTH=$((SCREEN_WIDTH / 2))
HALF_HEIGHT=$((SCREEN_HEIGHT / 2))

echo "Resolução detectada: ${SCREEN_WIDTH}x${SCREEN_HEIGHT}"

# Função para abrir VLC
open_vlc () {
  local URL=$1

  "$VLC_APP/Contents/MacOS/VLC" \
    --no-video-title-show \
    --no-audio \
    --quiet \
    "$URL" &
}

# Abrir os 4 streams
open_vlc "$URL1"
open_vlc "$URL2"
open_vlc "$URL3"
open_vlc "$URL4"

# Esperar abrir
sleep 3

# Posicionar janelas com AppleScript
osascript <<EOF
tell application "VLC"
    activate
end tell

tell application "System Events"
    tell process "VLC"
        set vlcWindows to windows
        
        if (count of vlcWindows) < 4 then
            return
        end if

        -- Top Left
        set position of item 1 of vlcWindows to {0, 0}
        set size of item 1 of vlcWindows to {$HALF_WIDTH, $HALF_HEIGHT}

        -- Top Right
        set position of item 2 of vlcWindows to {$HALF_WIDTH, 0}
        set size of item 2 of vlcWindows to {$HALF_WIDTH, $HALF_HEIGHT}

        -- Bottom Left
        set position of item 3 of vlcWindows to {0, $HALF_HEIGHT}
        set size of item 3 of vlcWindows to {$HALF_WIDTH, $HALF_HEIGHT}

        -- Bottom Right
        set position of item 4 of vlcWindows to {$HALF_WIDTH, $HALF_HEIGHT}
        set size of item 4 of vlcWindows to {$HALF_WIDTH, $HALF_HEIGHT}
    end tell
end tell
EOF

echo "Streams carregados em 4 quadrantes."
