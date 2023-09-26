// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0

import { respond } from "@aws-samples/crosstalk-common";
import * as AWS from "aws-sdk";
import { GuidString } from "aws-sdk/clients/chime";
import { v4 as uuid } from "uuid";

const chime = new AWS.Chime({ region: "us-east-1" });

/**
 * used by UI to create a new video chat session using the Chime SDK
 */
export const chimeCallHandler = async (event: any, context: any) => {
  const requestId = context.awsRequestId;
  const region = process.env.AWS_REGION;

  try {
    const meeting = await chime
      .createMeeting({
        ClientRequestToken: requestId,
        MediaRegion: region
      })
      .promise();

    const meetingId: GuidString = meeting.Meeting!.MeetingId as GuidString;

    try {
      const caller = await chime
        .createAttendee({
          MeetingId: meetingId,
          ExternalUserId: uuid()
        })
        .promise();

      const callee = await chime
        .createAttendee({
          MeetingId: meetingId,
          ExternalUserId: uuid()
        })
        .promise();

      return respond(200, {
        Meeting: meeting.Meeting,
        Caller: caller.Attendee,
        Callee: callee.Attendee
      });
    } catch (err) {
      console.log("err: ", err);
    }
  } catch (err) {
    console.log("err: ", err);
  }

  return respond(500, {});
};
