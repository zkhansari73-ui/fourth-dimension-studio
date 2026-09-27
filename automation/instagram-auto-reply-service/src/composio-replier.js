import { Composio } from "@composio/core";

export class ComposioReplier {
  constructor(config) {
    this.config = config;
    this.client = new Composio({
      apiKey: config.composioApiKey,
      toolkitVersions: {
        instagram: config.composioInstagramVersion,
      },
    });
  }

  #request(arguments_) {
    const request = {
      arguments: arguments_,
      version: this.config.composioInstagramVersion,
    };
    if (this.config.composioUserId) request.userId = this.config.composioUserId;
    if (this.config.composioConnectedAccountId) {
      request.connectedAccountId = this.config.composioConnectedAccountId;
    }
    return request;
  }

  async listMediaComments(mediaId, after = "") {
    const arguments_ = {
      ig_media_id: mediaId,
      limit: 100,
      fields: "id,text,username,timestamp,like_count,from,hidden,media,parent_id",
    };
    if (after) arguments_.after = after;
    return this.client.tools.execute(
      "INSTAGRAM_GET_IG_MEDIA_COMMENTS",
      this.#request(arguments_),
    );
  }

  async verifyConnectedAccount() {
    if (this.config.composioConnectedAccountId) {
      const account = await this.client.connectedAccounts.get(
        this.config.composioConnectedAccountId,
      );
      if (account?.status !== "ACTIVE" || account?.toolkit?.slug !== "instagram") {
        throw new Error(
          "Configured connected account is not an active Instagram account",
        );
      }
      return {
        id: account.id,
        userId: this.config.composioUserId,
        status: account.status,
      };
    }

    const response = await this.client.connectedAccounts.list({
      userIds: [this.config.composioUserId],
      toolkitSlugs: ["instagram"],
      statuses: ["ACTIVE"],
    });
    const items = Array.isArray(response?.items) ? response.items : [];
    const account = items[0];
    if (!account) {
      throw new Error(
        `Configured active Instagram account was not found; active count=${items.length}`,
      );
    }
    return {
      id: account.id,
      userId: account.userId ?? this.config.composioUserId,
      status: account.status ?? "ACTIVE",
    };
  }

  async replyToComment(commentId, message) {
    const request = this.#request({
        ig_comment_id: commentId,
        message,
    });

    const result = await this.client.tools.execute(
      "INSTAGRAM_POST_IG_COMMENT_REPLIES",
      request,
    );
    if (result?.successful === false || result?.error) {
      throw new Error(result?.error?.message ?? result?.error ?? "Composio reply failed");
    }
    return result;
  }
}
