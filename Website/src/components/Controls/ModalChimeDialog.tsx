// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0

import React from "react";

import {
    PreviewVideo,
    RemoteVideo,
    useLocalVideo,
    useRemoteVideoTileState,
    useToggleLocalMute
} from "amazon-chime-sdk-component-library-react";

import {
    Box,
    Button,
    Grid,
    Modal,
    Toggle
} from "aws-northstar";

import Text from 'aws-northstar/components/Text';

interface ModalChimeDialogProperties {
    onEndCall: any;
    infoPanel?: React.ReactNode;
}

/**
 * This component is the initial implementation of a chime sdk chat interface -
 * with only very basic controls at this stage
 *
 * @param onEndCall - function object invoked when the user leaves the chime session
 */
const ModalChimeDialog: React.FC<ModalChimeDialogProperties> = ({ onEndCall, infoPanel }) => {
    const { toggleVideo, isVideoEnabled } = useLocalVideo();
    const { muted, toggleMute } = useToggleLocalMute();
    const { tiles } = useRemoteVideoTileState();

    const videos = tiles.map((tileId) => (
        <div key={tileId} style={{ height: "15rem", width: '25rem', margin: '2rem auto' }}>
            <RemoteVideo tileId={tileId} />
        </div>
    ));
    
    return (
        <Modal title="Chime SDK Video Call" visible={true} onClose={onEndCall}>
            <Grid container alignContent="center" spacing={1}>
                <Grid item xs={12}>
                    <div className={`grid grid--size-${tiles.length}`}>
                        {tiles.length ? videos :
                            <Box style={{ height: "15rem", width: '100%', margin: '2rem auto' }} borderColor='black' border={'1px dashed grey'}>
                                <Text>No remote video available</Text>
                            </Box>}
                    </div>
                    <div style={{ height: "5rem", width: '9rem', margin: '2rem auto' }}>
                        {isVideoEnabled ? <PreviewVideo /> :
                            <Box height={'100%'} borderColor='black' border={'1px dashed grey'}>
                                <Text>Video disabled</Text>
                            </Box>}
                    </div>
                </Grid>
                <Grid item xs={12} style={{ textAlign: 'center' }}>
                    <Grid container alignContent="center" spacing={1}>
                        <Grid item xs={3}>
                            <Toggle label={isVideoEnabled ? "Video Enabled" : "Video Disabled"} onChange={toggleVideo}/>
                        </Grid>
                        <Grid item xs={3}>
                            <Toggle label={muted ? "Microphone Muted" : "Microphone Unmuted"} onChange={toggleMute}/>
                        </Grid>
                        <Grid item xs={3}>
                        </Grid>
                        <Grid item xs={3}>
                            <Button variant={"primary"} onClick={onEndCall}>Finish</Button>
                        </Grid>
                    </Grid>
                </Grid>
            </Grid>
            { infoPanel ? <Grid item xs={12}><div style={{ height: 20 }}></div></Grid> : null}
            { infoPanel ? <Grid item xs={12}>{infoPanel}</Grid> : null}
        </Modal>
    )
}

export default ModalChimeDialog;
