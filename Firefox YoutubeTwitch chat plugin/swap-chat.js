// Twitch/YouTube Chat Swapper UI built directly into the YouTube interface...
// Author: Alfthebigheaded

(function () {

  function getChannelName() {
    let name = null;
    let link = document.querySelector('ytd-channel-name a, #owner-name a');
    if (link && link.href) {
      let h = link.href.match(/youtube.com\/@([\w\d_\-.]+)/i);
      if (h && h[1]) name = h[1];
      if (!name) {
        let a = link.href.match(/youtube.com\/(c|user|channel)\/([^/?&#]+)/i);
        if (a && a[2]) name = a[2];
      }
    }

    if (!name) {
      let c = document.querySelector('ytd-channel-name, #owner-name a');
      if (c) {
        let txt = c.textContent.trim();
        let at = txt.match(/@([\w\d_\-.]+)/);
        name = at && at[1] ? at[1] : txt.replace(/\s+/g, ' ').split(' ')[0];
      }
    }

    if (!name) {
      let canonical = document.querySelector('link[rel="canonical"]');
      if (canonical && canonical.href) {
        let m = canonical.href.match(/youtube.com\/@([\w\d_\-.]+)/i);
        if (m) name = m[1];
        let a = canonical.href.match(/youtube.com\/(c|user|channel)\/([^/?&#]+)/i);
        if (a) name = a[2];
      }
    }
    return name || '';
  }

  function getOverrideKey(channelName) {
    let ytChannelId = null;
    let link = document.querySelector('ytd-channel-name a, #owner-name a');
    if (link && link.href) {
      let m = link.href.match(/youtube.com\/(user|c|channel|@)([\w\d_\-.]*)/i);
      if (m && m[2]) ytChannelId = m[2];
    }
    return ytChannelId ? `yt-twitch-chat-swapper:override_${ytChannelId}` : (channelName ? `yt-twitch-chat-swapper:override_${channelName}` : null);
  }

  function styleButton(btn) {
    btn.style.background = '#9147ff';
    btn.style.color = '#fff';
    btn.style.fontWeight = 'bold';
    btn.style.fontSize = '13px';
    btn.style.padding = '5px 10px';
    btn.style.border = 'none';
    btn.style.borderRadius = '5px';
    btn.style.cursor = 'pointer';
    btn.style.boxShadow = '0 1px 4px #9147ff28';
    btn.style.transition = 'background 0.18s';
    btn.style.marginRight = '2px';
    btn.onmouseover = () => { btn.style.background = '#772ce8'; };
    btn.onmouseout = () => { btn.style.background = '#9147ff'; };
  }

  function ensureHeader(channelName, storageKey, onUpdateChannel, chatType) {

    // Remove old header if present
    let oldH = document.getElementById('yt-twitch-header-wrap');
    if (oldH) oldH.remove();
    let header = document.createElement('div');
    header.id = 'yt-twitch-header-wrap';
    header.style.width = '100%';
    header.style.background = '#18181b';
    header.style.borderBottom = '1px solid #222';
    header.style.padding = '14px 12px 10px 12px';
    header.style.display = 'flex';
    header.style.flexDirection = 'column';
    header.style.alignItems = 'center';
    header.style.zIndex = '999';
    header.style.boxSizing = 'border-box';

    // Title row
    const titleRow = document.createElement('div');
    titleRow.style.display = 'flex';
    titleRow.style.width = '100%';
    titleRow.style.alignItems = 'center';
    titleRow.style.marginBottom = '5px';

    const titleLabel = document.createElement('div');
    titleLabel.id = 'yt-twitch-topmsg';
    titleLabel.innerText = 'Twitch Chat';
    titleLabel.style.color = '#fff';
    titleLabel.style.fontWeight = 'bold';
    titleLabel.style.fontSize = '17px';
    titleLabel.style.letterSpacing = '.3px';
    titleLabel.style.flex = '1 1 auto';
    titleLabel.style.alignSelf = 'flex-start';

    const toggleBtn = document.createElement('button');
    toggleBtn.id = 'yt-twitch-togglebtn';
    toggleBtn.textContent = 'Show YouTube Chat';
    toggleBtn.style.marginLeft = '10px';
    toggleBtn.style.background = '#222';
    toggleBtn.style.color = '#fff';
    toggleBtn.style.fontWeight = 'bold';
    toggleBtn.style.border = '1px solid #6337c3';
    toggleBtn.style.borderRadius = '5px';
    toggleBtn.style.padding = '4px 12px';
    toggleBtn.style.fontSize = '13px';
    toggleBtn.style.cursor = 'pointer';

    const collapseBtn = document.createElement('button');
    collapseBtn.innerHTML = '&#9660;';
    collapseBtn.title = 'Show/hide chat controls';
    collapseBtn.style.marginLeft = '6px';
    collapseBtn.style.background = '#222';
    collapseBtn.style.color = '#eee';
    collapseBtn.style.fontWeight = 'bold';
    collapseBtn.style.border = '1px solid #6337c3';
    collapseBtn.style.borderRadius = '50%';
    collapseBtn.style.width = '26px';
    collapseBtn.style.height = '26px';
    collapseBtn.style.display = 'flex';
    collapseBtn.style.alignItems = 'center';
    collapseBtn.style.justifyContent = 'center';
    collapseBtn.style.fontSize = '14px';
    collapseBtn.style.lineHeight = '1';
    collapseBtn.style.cursor = 'pointer';
    titleRow.appendChild(titleLabel);
    titleRow.appendChild(toggleBtn);
    titleRow.appendChild(collapseBtn);
    header.appendChild(titleRow);

    // Controls (collapsible)
    const controls = document.createElement('div');
    controls.id = 'yt-twitch-collapsible';
    controls.style.width = '100%';
    controls.style.transition = 'max-height 0.20s';
    controls.style.overflow = 'hidden';

    // Per-channel key for collapsible state
    const collKey = 'yt-twitch-collapsible-collapsed-' + channelName;
    let collapsed = false;

    // Restore collapsible status from localStorage for this channel
    if (chatType === 'twitch') {
      collapsed = localStorage.getItem(collKey) === 'true';
      controls.style.display = collapsed ? 'none' : 'block';
      collapseBtn.innerHTML = collapsed ? '&#9650;' : '&#9660;';
    }
    controls.style.display = (chatType === 'twitch') ? (collapsed ? 'none' : 'block') : 'none';

    collapseBtn.onclick = function () {
      collapsed = !collapsed;
      localStorage.setItem(collKey, collapsed);
      controls.style.display = collapsed ? 'none' : 'block';
      collapseBtn.innerHTML = collapsed ? '&#9650;' : '&#9660;';
    };

    const explain = document.createElement('div');
    explain.innerHTML = "Replace YouTube chat with Twitch chat automatically. <small style='color:#aaa'>(enter a channel to override)</small>";
    explain.style.color = '#eee';
    explain.style.fontSize = '14px';
    explain.style.marginBottom = '7px';
    explain.style.alignSelf = 'flex-start';

    // Input row
    const inputRow = document.createElement('div');
    inputRow.style.display = 'flex';
    inputRow.style.alignItems = 'center';
    inputRow.style.gap = '7px';
    inputRow.style.marginBottom = '3px';
    inputRow.style.alignSelf = 'stretch';
    inputRow.style.width = '100%';
    inputRow.style.overflow = 'hidden';
    inputRow.style.minWidth = '0';
    inputRow.style.flexWrap = 'nowrap';
    inputRow.style.maxWidth = '100%';
    const label = document.createElement('span');
    label.textContent = 'Channel:';
    label.style.color = '#aaa';
    label.style.fontSize = '13px';
    label.style.marginRight = '2px';
    const input = document.createElement('input');
    input.type = 'text';
    input.value = channelName;
    input.placeholder = 'Twitch channel name...';
    input.style.padding = '4px 8px';
    input.style.border = '1px solid #6337c3';
    input.style.background = '#232323';
    input.style.color = '#eee';
    input.style.borderRadius = '5px';
    input.style.fontSize = '13px';
    input.style.flex = '1 1 0';
    input.style.minWidth = '0';
    input.style.maxWidth = '100%';
    input.style.boxSizing = 'border-box';
    input.style.overflow = 'hidden';
    const popoutBtn = document.createElement('button');
    popoutBtn.textContent = 'Popout';
    styleButton(popoutBtn);
    popoutBtn.style.flex = '0 1 auto';
    popoutBtn.style.minWidth = '0';
    popoutBtn.style.maxWidth = '100%';
    popoutBtn.style.boxSizing = 'border-box';
    popoutBtn.style.overflow = 'hidden';
    const overrideBtn = document.createElement('button');
    overrideBtn.textContent = 'Override';
    styleButton(overrideBtn);
    overrideBtn.style.flex = '0 1 auto';
    overrideBtn.style.minWidth = '0';
    overrideBtn.style.maxWidth = '100%';
    overrideBtn.style.boxSizing = 'border-box';
    overrideBtn.style.overflow = 'hidden';
    inputRow.appendChild(label);
    inputRow.appendChild(input);
    inputRow.appendChild(overrideBtn);
    inputRow.appendChild(popoutBtn);
    controls.appendChild(explain);
    controls.appendChild(inputRow);

    const resultMsg = document.createElement('div');
    resultMsg.id = 'yt-twitch-resultmsg';
    resultMsg.style.color = '#fff';
    resultMsg.style.fontSize = '12px';
    resultMsg.style.marginTop = '4px';
    resultMsg.style.height = '16px';
    resultMsg.style.alignSelf = 'flex-start';
    controls.appendChild(resultMsg);
    header.appendChild(controls);

    // Insert header above embed chat
    function insertHeaderAboveChat() {
      const resizableBox = document.getElementById('yt-twitch-resizable');
      if (resizableBox) {
        if (resizableBox.firstChild !== header) {
          resizableBox.insertBefore(header, resizableBox.firstChild);
        }
        return;
      }
      // fallback: insert above ytd-live-chat-frame
      const chatFrame = document.querySelector('ytd-live-chat-frame');
      if (chatFrame && chatFrame.parentNode) {
        if (chatFrame.previousSibling !== header) {
          chatFrame.parentNode.insertBefore(header, chatFrame);
        }
      }
    }
    insertHeaderAboveChat();

    if (window._ytTwitchHeaderObserver) {
      window._ytTwitchHeaderObserver.disconnect();
    }
    // MutationObserver should watch the main chat container's parent
    let parent = null;
    // Prefer the resizable box, fallback to chat frame's parent
    const resizableBox = document.getElementById('yt-twitch-resizable');
    if (resizableBox) {
      parent = resizableBox.parentNode;
    } else {
      const chatFrame = document.querySelector('ytd-live-chat-frame');
      if (chatFrame) parent = chatFrame.parentNode;
    }
    if (parent) {
      window._ytTwitchHeaderObserver = new MutationObserver(function() {
        insertHeaderAboveChat();
      });
      window._ytTwitchHeaderObserver.observe(parent, {childList:true});
    }

    // Popout chat
    popoutBtn.onclick = function () {
      let ch = input.value.trim();

      if (!ch) {
        resultMsg.textContent = 'Please enter a Twitch channel.';
        resultMsg.style.color = '#ff8c8c';
        return;
      }

      window.open(`https://www.twitch.tv/popout/${ch}/chat?popout=`, '_blank');
      resultMsg.textContent = `Opened chat for: ${ch}`;
      resultMsg.style.color = '#fff';
      if (onUpdateChannel) onUpdateChannel(ch);
    };

    input.addEventListener('keyup', function (e) {
      if (e.key === 'Enter') popoutBtn.onclick();
    });

    overrideBtn.onclick = function () {
      let ch = input.value.trim();
      if (storageKey) localStorage.setItem(storageKey, ch);
      resultMsg.textContent = `Override saved: ${ch}`;
      resultMsg.style.color = '#b0ffa0';
      if (onUpdateChannel) onUpdateChannel(ch);
    };

    return { header, toggleBtn, titleLabel, input, controls, collapseBtn };
  }

  function runSwapper() {

    const ytChat = document.querySelector('ytd-live-chat-frame');

    if (!ytChat) {
      // Wait for chat to be present then rerun
      if (!window._ytTwitchSwapperPending) {
        window._ytTwitchSwapperPending = true;
        setTimeout(function() {
          window._ytTwitchSwapperPending = false;
          runSwapper();
        }, 1000);
      }
      return;
    }

    let channelName = getChannelName();
    let storageKey = getOverrideKey(channelName);

    if (storageKey && localStorage.getItem(storageKey)) {
      channelName = localStorage.getItem(storageKey);
    }

    // Per channel chat type and chat height
    const chatTypeKey = 'yt-twitch-chat-toggle-' + channelName;
    let chatType = localStorage.getItem(chatTypeKey) || 'youtube';
    let chatHeightKey = 'yt-twitch-chat-height-' + channelName;
    let currentChannel = channelName;

    // main UI header and embed logic --
    let updateEmbed = (newChannel) => {
      currentChannel = newChannel;
      // If in Twitch mode, refresh chat:
      if (chatType === 'twitch') setChatEmbed('twitch');
    };

    let { toggleBtn, titleLabel, input, controls, collapseBtn } = ensureHeader(currentChannel, storageKey, updateEmbed, chatType);

    // Resizable container for chat
    let resizeBox = document.getElementById('yt-twitch-resizable');

    if (!resizeBox) {
      resizeBox = document.createElement('div');
      resizeBox.id = 'yt-twitch-resizable';
      resizeBox.style.width = '100%';
      resizeBox.style.minHeight = '250px';
      resizeBox.style.maxHeight = '90vh';
      resizeBox.style.overflow = 'auto';
      resizeBox.style.resize = 'vertical';
      resizeBox.style.display = 'flex';
      resizeBox.style.flexDirection = 'column';
      resizeBox.style.position = 'relative';
      resizeBox.style.height = localStorage.getItem(chatHeightKey) || '400px';
      resizeBox.style.boxSizing = 'border-box';
      ytChat.parentNode.insertBefore(resizeBox, ytChat);
    }

    let embedBox = document.getElementById('yt-twitch-embedbox');

    if (!embedBox) {
      embedBox = document.createElement('div');
      embedBox.id = 'yt-twitch-embedbox';
      embedBox.style.width = '100%';
      embedBox.style.flex = '1 1 100%';
      embedBox.style.height = '100%';
      embedBox.style.display = 'flex';
      embedBox.style.flexDirection = 'column';
      embedBox.style.boxSizing = 'border-box';
      resizeBox.appendChild(embedBox);
    }

    function setChatEmbed(type) {
      embedBox.innerHTML = '';
      const iframe = document.createElement('iframe');
      iframe.setAttribute('scrolling', 'no');
      iframe.style.flex = '1 1 100%';
      iframe.style.width = '100%';
      iframe.style.height = '100%';
      iframe.style.minHeight = '0';
      iframe.style.boxSizing = 'border-box';
      iframe.style.border = 'none';
      iframe.style.background = '#18181b';
      if (type === 'twitch') {
        // Robust dark mode detection
        let html = document.documentElement;
        let body = document.body;
        let isDark = false;
        if (html.classList.contains('dark') || body.classList.contains('dark')) {
          isDark = true;
        }
        // Also check YouTube CSS variables for dark mode
        if (!isDark) {
          const bgCol = getComputedStyle(html).getPropertyValue('--yt-spec-general-background-a');
          if (bgCol && bgCol.trim() === '#0f0f0f') isDark = true;
        }
        let parentParam = 'parent=www.youtube.com';
        let url = `https://www.twitch.tv/embed/${currentChannel}/chat?${isDark ? 'darkpopout&' : ''}${parentParam}`;
        iframe.src = url;
      } else {
        let vid = null;
        let m = window.location.href.match(/[?&]v=([\w\-]{11})/);
        if (!m && window.location.pathname.includes('/watch')) {
          let params = new URLSearchParams(window.location.search);
          if (params.has('v')) vid = params.get('v');
        } else if (m) { vid = m[1]; }
        if (!vid) {
          let wf = document.querySelector('ytd-watch-flexy');
          if (wf && wf.hasAttribute('video-id')) vid = wf.getAttribute('video-id');
        }
        if (vid) {
          iframe.src = `https://www.youtube.com/live_chat?v=${vid}&is_popout=1`;
        } else {
          iframe.style.display = 'none';
        }
      }
      embedBox.appendChild(iframe);
    }

    // Initial load
    setChatEmbed(chatType);

    function updateToggleLabel() {
      if (chatType === 'twitch') {
        toggleBtn.textContent = 'Show YouTube Chat';
        titleLabel.innerText = 'Twitch Chat';
        const ch = input.value.trim() || channelName;
        const k = 'yt-twitch-collapsible-collapsed-' + ch;
        let collapsed = localStorage.getItem(k) === 'true';
        controls.style.display = collapsed ? 'none' : 'block';
        collapseBtn.innerHTML = collapsed ? '&#9650;' : '&#9660;';
        if(collapseBtn) collapseBtn.style.display = 'flex';
      } else {
        toggleBtn.textContent = 'Show Twitch Chat';
        titleLabel.innerText = 'YouTube Chat';
        controls.style.display = 'none';
        if(collapseBtn) collapseBtn.style.display = 'none';
      }
    }

    updateToggleLabel();

    toggleBtn.onclick = function () {
      chatType = (chatType === 'twitch') ? 'youtube' : 'twitch';
      setChatEmbed(chatType);
      localStorage.setItem(chatTypeKey, chatType);
      updateToggleLabel();
    };

    resizeBox.addEventListener('mouseup', function () {
      localStorage.setItem(chatHeightKey, resizeBox.style.height);
    });

    resizeBox.addEventListener('touchend', function () {
      localStorage.setItem(chatHeightKey, resizeBox.style.height);
    });

    ytChat.style.display = 'none';

  }

  let lastUrl = location.href;

  if (!window._ytTwitchSwapperInterval) {
    window._ytTwitchSwapperInterval = setInterval(function () {
      if (location.href !== lastUrl) {
        lastUrl = location.href;
        setTimeout(runSwapper, 2000);
      }
    }, 1000);
  }
  if (!window._ytTwitchSwapperLoaded) {
    window._ytTwitchSwapperLoaded = true;
    setTimeout(runSwapper, 5000);
  }
})();
