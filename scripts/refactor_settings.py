import sys

def replace_tab_0(file_path):
    with open(file_path, 'r') as f:
        lines = f.readlines()
    
    start_line = -1
    end_line = -1
    
    for i, line in enumerate(lines):
        if '<TabPanel value={tabValue} index={0}>' in line:
            start_line = i
            break
            
    if start_line == -1:
        print("TabPanel index={0} not found")
        return
        
    for i in range(start_line, len(lines)):
        if '</TabPanel>' in lines[i]:
            end_line = i
            break
            
    if end_line == -1:
        print("Closing TabPanel not found")
        return
        
    new_content = [
        '          <TabPanel value={tabValue} index={0}>\n',
        '            <Suspense fallback={\n',
        '              <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", py: 10, gap: 2 }}>\n',
        '                <CircularProgress size={40} thickness={4} sx={{ color: "primary.main" }} />\n',
        '                <Typography variant="caption" sx={{ fontWeight: 800, color: "text.secondary" }}>{t("common.loading")}</Typography>\n',
        '              </Box>\n',
        '            }>\n',
        '              <OutputTab \n',
        '                settings={settings}\n',
        '                setSettings={setSettings}\n',
        '                handleOutputTypeChange={handleOutputTypeChange}\n',
        '                handleResolutionChange={handleResolutionChange}\n',
        '                handleBitrateChange={handleBitrateChange}\n',
        '                handleCopyToClipboard={handleCopyToClipboard}\n',
        '              />\n',
        '            </Suspense>\n',
        '          </TabPanel>\n'
    ]
    
    lines[start_line:end_line+1] = new_content
    return lines

def replace_tab_1(lines):
    start_line = -1
    end_line = -1
    for i, line in enumerate(lines):
        if '<TabPanel value={tabValue} index={1}>' in line:
            start_line = i
            break
    if start_line == -1: return lines
    for i in range(start_line, len(lines)):
        if '</TabPanel>' in lines[i]:
            end_line = i
            break
    if end_line == -1: return lines
    new_content = [
        '          <TabPanel value={tabValue} index={1}>\n',
        '            <Suspense fallback={<Box sx={{ py: 10, textAlign: "center" }}><CircularProgress /></Box>}>\n',
        '              <PathsTab \n',
        '                settings={settings}\n',
        '                setSettings={setSettings}\n',
        '                setShowLogsDialog={setShowLogsDialog}\n',
        '                fetchSettings={fetchSettings}\n',
        '                showSuccess={showSuccess}\n',
        '                showError={showError}\n',
        '                setMediaTypeSelector={setMediaTypeSelector}\n',
        '                setMediaSelectorOpen={setMediaSelectorOpen}\n',
        '                fetchProtectedAssets={fetchProtectedAssets}\n',
        '              />\n',
        '            </Suspense>\n',
        '          </TabPanel>\n'
    ]
    lines[start_line:end_line+1] = new_content
    return lines

def replace_tab_2(lines):
    start_line = -1
    end_line = -1
    for i, line in enumerate(lines):
        if '<TabPanel value={tabValue} index={2}>' in line:
            start_line = i
            break
    if start_line == -1: return lines
    for i in range(start_line, len(lines)):
        if '</TabPanel>' in lines[i]:
            end_line = i
            break
    if end_line == -1: return lines
    new_content = [
        '          <TabPanel value={tabValue} index={2}>\n',
        '            <Suspense fallback={<Box sx={{ py: 10, textAlign: "center" }}><CircularProgress /></Box>}>\n',
        '              <PlayoutTab \n',
        '                settings={settings}\n',
        '                setSettings={setSettings}\n',
        '                navigate={navigate}\n',
        '                setResetConfirmOpen={setResetConfirmOpen}\n',
        '                handleCopyToClipboard={handleCopyToClipboard}\n',
        '                activePreset={activePreset}\n',
        '                applyPreset={applyPreset}\n',
        '                setMediaTypeSelector={setMediaTypeSelector}\n',
        '                setMediaSelectorOpen={setMediaSelectorOpen}\n',
        '                setConverterOpen={setConverterOpen}\n',
        '              />\n',
        '            </Suspense>\n',
        '          </TabPanel>\n'
    ]
    lines[start_line:end_line+1] = new_content
    return lines

def replace_tab_3(lines):
    start_line = -1
    end_line = -1
    for i, line in enumerate(lines):
        if '<TabPanel value={tabValue} index={3}>' in line:
            start_line = i
            break
    if start_line == -1: return lines
    for i in range(start_line, len(lines)):
        if '</TabPanel>' in lines[i]:
            end_line = i
            break
    if end_line == -1: return lines
    new_content = [
        '          <TabPanel value={tabValue} index={3}>\n',
        '            <Suspense fallback={<Box sx={{ py: 10, textAlign: "center" }}><CircularProgress /></Box>}>\n',
        '              <UsersTab \n',
        '                settings={settings}\n',
        '                setSettings={setSettings}\n',
        '                profiles={profiles}\n',
        '                users={users}\n',
        '                userRoles={userRoles}\n',
        '                userProfiles={userProfiles}\n',
        '                handleEditUser={handleEditUser}\n',
        '                handleDeleteUser={handleDeleteUser}\n',
        '                handleEditProfile={handleEditProfile}\n',
        '                handleDeleteProfile={handleDeleteProfile}\n',
        '                setAddUserOpen={setAddUserOpen}\n',
        '                setProfileDialogOpen={setProfileDialogOpen}\n',
        '                channelAccessOpen={channelAccessOpen}\n',
        '                setChannelAccessOpen={setChannelAccessOpen}\n',
        '                channelAccessUser={channelAccessUser}\n',
        '                setChannelAccessUser={setChannelAccessUser}\n',
        '                channelAccessIds={channelAccessIds}\n',
        '                setChannelAccessIds={setChannelAccessIds}\n',
        '                allChannels={allChannels}\n',
        '                userChannelAPI={userChannelAPI}\n',
        '                showSuccess={showSuccess}\n',
        '                showError={showError}\n',
        '              />\n',
        '            </Suspense>\n',
        '          </TabPanel>\n'
    ]
    lines[start_line:end_line+1] = new_content
    return lines

def replace_tab_4(lines):
    start_line = -1
    end_line = -1
    for i, line in enumerate(lines):
        if '<TabPanel value={tabValue} index={4}>' in line:
            start_line = i
            break
    if start_line == -1: return lines
    for i in range(start_line, len(lines)):
        if '</TabPanel>' in lines[i]:
            end_line = i
            break
    if end_line == -1: return lines
    new_content = [
        '          <TabPanel value={tabValue} index={4}>\n',
        '            <Suspense fallback={<Box sx={{ py: 10, textAlign: "center" }}><CircularProgress /></Box>}>\n',
        '              <AboutTab \n',
        '                settings={settings}\n',
        '                APP_VERSION_FALLBACK={APP_VERSION_FALLBACK}\n',
        '                APP_RELEASE_DATE_FALLBACK={APP_RELEASE_DATE_FALLBACK}\n',
        '                releaseHistory={releaseHistory}\n',
        '                roadmapData={roadmapData}\n',
        '                navigate={navigate}\n',
        '              />\n',
        '            </Suspense>\n',
        '          </TabPanel>\n'
    ]
    lines[start_line:end_line+1] = new_content
    return lines

def refactor_all(file_path):
    with open(file_path, 'r') as f:
        lines = f.readlines()
    
    # Tab 0 already replaced by previous run, but we will run again safely
    # Note: If tab 0 is already replaced, the search will/might fail depending on the string.
    # We'll just run all functions sequentially.
    
    # lines = replace_tab_0(lines) # Already done
    lines = replace_tab_1(lines)
    lines = replace_tab_2(lines)
    lines = replace_tab_3(lines)
    lines = replace_tab_4(lines)
    
    with open(file_path, 'w') as f:
        f.writelines(lines)
    print("Successfully refactored all tabs")

if __name__ == "__main__":
    refactor_all(sys.argv[1])
