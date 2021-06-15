// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0

import React, { useEffect, useMemo, useState } from "react";
import { Alert, Button, ColumnLayout, Inline, Stack } from "aws-northstar";
import { Card } from "@material-ui/core";
import { Auth } from "aws-amplify";
import { ChimeCallServiceClient } from "../../api/ChimeCallServiceClient";
import Heading from "aws-northstar/components/Heading";
import { useMeetingManager } from "amazon-chime-sdk-component-library-react";
import ModalChimeDialog from "../../components/Controls/ModalChimeDialog";
import AWSAppSyncClient from "aws-appsync";
import gql from "graphql-tag";

const {
    region,
    graphqlEndpoint,
    // @ts-ignore
} = window["runConfig"];

const chimeSessionStartedSubscription = gql(`
  subscription chimeSessionStarted {
    chimeSessionStarted {
      meeting
      attendee
      username
    }
  }
`);

const chimeSessionClaimedSubscription = gql(`
  subscription chimeSessionClaimed {
    chimeSessionClaimed
  }
`);

// define stub-mutation to notify other sessions of new chime call
const chimeSessionMutation = gql(`
  mutation startChimeSession($meeting: String!, $attendee: String!, $username: String!) {
    startChimeSession(meeting: $meeting, attendee: $attendee, username: $username) {
      meeting
      attendee
      username
    }
  }
`);

// define stub-mutation to notify other sessions of new chime call
const claimChimeSessionMutation = gql(`
  mutation claimChimeSession($meeting: String!) {
    claimChimeSession(meeting: $meeting)
  }
`);

/**
 * Component for the main homepage
 */
const HomeContainer: React.FC = () => {
    const chimeServiceProvider = useMemo(() => new ChimeCallServiceClient(), []);
    const meetingManager = useMeetingManager();
    const [showChimeChat, setShowChimeChat] = useState(false);
    const [newChimeSessionAvailable, setNewChimeSessionAvailable] = useState(false);
    const [currentMeeting, setCurrentMeeting] = useState();
    const [currentAttendee, setCurrentAttendee] = useState();
    const [callStarting, setCallStarting] = useState(false);
    const [appSyncClient, setAppSyncClient] = useState<any>();
    const [meetingSubscription, setMeetingSubscription] = useState<any>();
    const [claimedSubscription, setClaimedSubscription] = useState<any>();
    const [username, setUsername] = useState<string>();
    const [otherUsername, setOtherUsername] = useState<string>();

    const finishChimeCall = () => {
        meetingManager.leave();
        setShowChimeChat(false);
    };

    // workaround: complex types defined outside of graphql need
    // to be passed to mutations as json strings...except that
    // true json will be auto-boxed to an object, so we disguise
    // this as 'vanilla' string by replacing double quotes with
    // single quotes
    const graphqlify = (data: any) => {
        return JSON.stringify(data).replace(new RegExp('"', "g"), "'");
    };

    const joinChimeCall = async () => {
        const joinData = {
            meetingInfo: currentMeeting,
            attendeeInfo: currentAttendee,
        };

        // Use the join API to create a meeting session
        await meetingManager.join(joinData);

        // At this point you can let users setup their devices, or start the session immediately
        await meetingManager.start();

        setNewChimeSessionAvailable(false);
        setShowChimeChat(true);
        try {
            await appSyncClient.mutate({
                mutation: claimChimeSessionMutation,
                variables: {
                    meeting: graphqlify(currentMeeting),
                },
            });
        } catch (err) {
            console.log("err", err);
        }
    };

    const startChimeCall = async () => {
        setCallStarting(true);

        const createChimeResult: any = await chimeServiceProvider.createChimeSession();
        const meeting = createChimeResult.Meeting;
        const attendee = createChimeResult.Caller;

        const joinData = {
            meetingInfo: meeting,
            attendeeInfo: attendee,
        };

        // Use the join API to create a meeting session
        await meetingManager.join(joinData);

        // At this point you can let users setup their devices, or
        // start the session immediately
        await meetingManager.start();

        setShowChimeChat(true);
        setCallStarting(false);

        // notify logged-in users of a user wanting to chat via a
        // dummy graphql mutation - pass the meeting details as
        // stringified json
        try {
            await appSyncClient.mutate({
                mutation: chimeSessionMutation,
                variables: {
                    meeting: graphqlify(meeting),
                    attendee: graphqlify(createChimeResult.Callee),
                    username: "'" + username + "'",
                },
            });
        } catch (err) {
            console.log("err", err);
        }
    };

    const onChimeSessionStarted = (event: any) => {
        const meeting = JSON.parse(event.data.chimeSessionStarted.meeting.replace(/'/g, '"'));
        const attendee = JSON.parse(event.data.chimeSessionStarted.attendee.replace(/'/g, '"'));
        const otherUsername = event.data.chimeSessionStarted.username.replace(/'/g, '');

        setCurrentMeeting(meeting);
        setCurrentAttendee(attendee);
        setOtherUsername(otherUsername);
        setNewChimeSessionAvailable(true);
    };

    const onChimeSessionClaimed = (event: any) => {
        setNewChimeSessionAvailable(false);
    };

    useEffect(() => {
        (async () => {
            try {
                if (!username) {
                    const user = await Auth.currentAuthenticatedUser();
                    setUsername(user.getUsername());
                }
            } catch (e) {
                // No user currently logged in
            }
        })();

        if (!callStarting && !showChimeChat) {
            const client = new AWSAppSyncClient({
                url: graphqlEndpoint,
                region: region,
                disableOffline: true,
                auth: {
                    type: "AMAZON_COGNITO_USER_POOLS",
                    jwtToken: async () => (await Auth.currentSession()).getAccessToken().getJwtToken(),
                },
                complexObjectsCredentials: async () => await Auth.currentCredentials(),
            });

            client.hydrated().then(() => {
                const observable = client.subscribe({
                    query: chimeSessionStartedSubscription,
                });
                const subscription = observable.subscribe({
                    next: onChimeSessionStarted,
                    complete: console.log,
                    error: console.log,
                });
                setMeetingSubscription(subscription);

                if (!claimedSubscription) {
                    const callClaimedObservable = client.subscribe({
                        query: chimeSessionClaimedSubscription,
                    });
                    const callClaimedSubscription = callClaimedObservable.subscribe({
                        next: onChimeSessionClaimed,
                        complete: console.log,
                        error: console.log,
                    });
                    setClaimedSubscription(callClaimedSubscription);
                }

                setAppSyncClient(client);
            });
        } else {
            if (meetingSubscription) meetingSubscription.unsubscribe();
        }
    // don't want to do updates for 'claimedSubscription', 'meetingSubscription', and 'username'
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [callStarting, showChimeChat]);

    return (
        <ColumnLayout>
            <Stack>
                <Stack>
                    {newChimeSessionAvailable && !showChimeChat ? (
                        <Alert
                            type="info"
                            dismissible
                            buttonText={`Answer Call from ${otherUsername}`}
                            onDismiss={() => setNewChimeSessionAvailable(false)}
                            onButtonClick={joinChimeCall}
                        >
                            Incomming video call
                        </Alert>
                    ) : null}
                </Stack>
                <Card style={{ padding: 20 }}>
                    <div
                        style={{
                            display: "flex",
                            justifyContent: "space-between",
                        }}
                    >
                        <Heading variant="h2">Start a call</Heading>
                    </div>
                    <Heading variant="h5">press the button to start a Chime call</Heading>
                    <div style={{ marginTop: 20 }}>
                        <Inline>
                            <Button onClick={startChimeCall} icon="AccountCircleTwoTone" loading={callStarting}>
                                Start Chat!
                            </Button>
                        </Inline>
                    </div>
                    {showChimeChat ? <ModalChimeDialog onEndCall={finishChimeCall} /> : null}
                </Card>
            </Stack>
        </ColumnLayout>
    );
};

export default HomeContainer;
