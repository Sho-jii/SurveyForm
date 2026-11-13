import { createClient, isSupabaseConfigured } from "@/services/supabase/client";
import { Survey, SurveyResponse, SurveySchema } from "../types";
import { generateSlug } from "@/lib/utils";
import { deviceSessionService } from "@/services/session/deviceSessionService";

// Local cache/fallback for immediate preview and offline testing
let inMemorySurveys: Survey[] = [];
let inMemoryResponses: SurveyResponse[] = [];

// Seed sample survey if empty
function initializeSample() {
  if (inMemorySurveys.length === 0) {
    const sample: Survey = {
      id: "sample-hitovis-evaluation",
      slug: "hitovis-capstone-evaluation",
      title: "CAPSTONE EVALUATION FORM - HITOVIS Catfish Aquaculture Management System",
      description: "ISO/IEC 25010:2011 and UTAUT Technology Acceptance Evaluation for Catfish Aquaculture",
      instructions: "Respond to each statement according to the 5-point Likert scale (1 = Strongly Disagree to 5 = Strongly Agree).",
      schema: {
        sections: [
          { id: "iso_sec_1", title: "1. FUNCTIONAL SUITABILITY", part: "ISO/IEC 25010:2011", order: 1 },
          { id: "iso_sec_2", title: "2. RELIABILITY", part: "ISO/IEC 25010:2011", order: 2 },
          { id: "iso_sec_3", title: "3. PERFORMANCE EFFICIENCY", part: "ISO/IEC 25010:2011", order: 3 },
          { id: "iso_sec_4", title: "4. USABILITY", part: "ISO/IEC 25010:2011", order: 4 },
          { id: "iso_sec_5", title: "5. SECURITY", part: "ISO/IEC 25010:2011", order: 5 },
          { id: "utaut_sec_1", title: "1. PERFORMANCE EXPECTANCY", part: "UTAUT", order: 6 },
          { id: "utaut_sec_2", title: "2. EFFORT EXPECTANCY", part: "UTAUT", order: 7 },
        ],
        questions: [
          {
            id: "demographic_name",
            type: "text",
            title: "Full Name",
            description: "Optional. Leave blank to submit anonymously.",
            required: false,
            placeholder: "e.g. Juan Dela Cruz",
          },
          {
            id: "demographic_role",
            type: "single_choice",
            title: "Respondent Classification / Stakeholder Role",
            description: "Please select your primary role or stakeholder group.",
            required: true,
            options: ["Community/Fisherman", "Client", "IT Expert", "Others"],
          },
          {
            id: "matrix_iso_sec_1",
            sectionId: "iso_sec_1",
            type: "likert_matrix",
            title: "1. FUNCTIONAL SUITABILITY",
            description: "Evaluate the functional completeness and correctness of the device.",
            required: true,
            scale: {
              min: 1,
              max: 5,
              labels: {
                "1": "Strongly Disagree",
                "2": "Disagree",
                "3": "Moderately Agree",
                "4": "Agree",
                "5": "Strongly Agree",
              },
            },
            matrixRows: [
              {
                id: "iso_sec_1_1_1",
                code: "1.1",
                label: "Functional completeness",
                description: "The device provides the functions needed for the farm activities it is intended to support.",
              },
              {
                id: "iso_sec_1_1_2",
                code: "1.2",
                label: "Functional correctness",
                description: "The information produced by device is correct for the tasks evaluated.",
              },
              {
                id: "iso_sec_1_1_3",
                code: "1.3",
                label: "Functional appropriateness",
                description: "The device helps users complete intended farm activities without unnecessary steps.",
              },
              {
                id: "iso_sec_1_1_4",
                code: "1.4",
                label: "As a whole",
                description: "The device provides appropriate and correct functions that meet the needs of its intended farm activities.",
              },
            ],
          },
          {
            id: "matrix_utaut_sec_1",
            sectionId: "utaut_sec_1",
            type: "likert_matrix",
            title: "1. PERFORMANCE EXPECTANCY",
            description: "Rate the extent to which using the system helps achieve aquaculture tasks.",
            required: true,
            scale: {
              min: 1,
              max: 5,
              labels: {
                "1": "Strongly Disagree",
                "2": "Disagree",
                "3": "Moderately Agree",
                "4": "Agree",
                "5": "Strongly Agree",
              },
            },
            matrixRows: [
              {
                id: "utaut_sec_1_1_1",
                code: "1.1",
                label: "Effectiveness",
                description: "Using the system would help me monitor tank conditions more effectively.",
              },
              {
                id: "utaut_sec_1_1_2",
                code: "1.2",
                label: "Efficiency",
                description: "Using the system would help me complete my assigned aquaculture tasks more quickly.",
              },
              {
                id: "utaut_sec_1_1_3",
                code: "1.3",
                label: "Informed Decision",
                description: "Using the system would help me make informed decisions about tank management.",
              },
            ],
          },
          {
            id: "comments_suggestions",
            type: "textarea",
            title: "Comments / Suggestions",
            description: "Please share any additional observations, feedback, or recommendations.",
            required: false,
            placeholder: "Type any recommendations or comments...",
          },
        ],
        settings: {
          requireAll: false,
          allowAnonymous: true,
          showProgressBar: true,
          confirmationMessage: "Thank you for completing the survey evaluation!",
          submitButtonText: "Submit Evaluation",
        },
      },
      status: "published",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      response_count: 5,
    };
    inMemorySurveys.push(sample);

    // Add some sample responses
    inMemoryResponses.push(
      {
        id: "resp-1",
        survey_id: sample.id,
        respondent_name: "Engr. Reyes",
        respondent_role: "IT Expert",
        answers: {
          demographic_name: "Engr. Reyes",
          demographic_role: "IT Expert",
          iso_sec_1_1_1: 5,
          iso_sec_1_1_2: 5,
          iso_sec_1_1_3: 4,
          iso_sec_1_1_4: 5,
          utaut_sec_1_1_1: 5,
          utaut_sec_1_1_2: 5,
          utaut_sec_1_1_3: 5,
          comments_suggestions: "Highly functional and accurate IoT architecture.",
        },
        completion_status: "completed",
        created_at: new Date(Date.now() - 3600000 * 24).toISOString(),
        updated_at: new Date(Date.now() - 3600000 * 24).toISOString(),
      },
      {
        id: "resp-2",
        survey_id: sample.id,
        respondent_name: "Mang Juan",
        respondent_role: "Community/Fisherman",
        answers: {
          demographic_name: "Mang Juan",
          demographic_role: "Community/Fisherman",
          iso_sec_1_1_1: 5,
          iso_sec_1_1_2: 4,
          iso_sec_1_1_3: 5,
          iso_sec_1_1_4: 5,
          utaut_sec_1_1_1: 5,
          utaut_sec_1_1_2: 4,
          utaut_sec_1_1_3: 4,
          comments_suggestions: "Napaka laking tulong sa pag-aalaga ng hito.",
        },
        completion_status: "completed",
        created_at: new Date(Date.now() - 3600000 * 12).toISOString(),
        updated_at: new Date(Date.now() - 3600000 * 12).toISOString(),
      },
      {
        id: "resp-3",
        survey_id: sample.id,
        respondent_name: null,
        respondent_role: "Client",
        answers: {
          demographic_name: "",
          demographic_role: "Client",
          iso_sec_1_1_1: 4,
          iso_sec_1_1_2: 5,
          iso_sec_1_1_3: 4,
          iso_sec_1_1_4: 4,
          utaut_sec_1_1_1: 4,
          utaut_sec_1_1_2: 5,
          utaut_sec_1_1_3: 5,
          comments_suggestions: "Clean UI and fast real-time response.",
        },
        completion_status: "completed",
        created_at: new Date(Date.now() - 3600000 * 4).toISOString(),
        updated_at: new Date(Date.now() - 3600000 * 4).toISOString(),
      }
    );
  }
}

initializeSample();

function hydrateSurveyRecord(record: any): Survey {
  const settings = record.schema?.settings || {};
  return {
    ...record,
    signatories: settings.signatories || record.signatories || null,
    capstone_logo_url: settings.capstoneLogoUrl || record.capstone_logo_url || null,
    certificate_theme_color: settings.certificateThemeColor || record.certificate_theme_color || "gold",
    secondary_signatory_name: settings.secondarySignatoryName || record.secondary_signatory_name || null,
    secondary_signatory_title: settings.secondarySignatoryTitle || record.secondary_signatory_title || null,
    secondary_signatory_organization: settings.secondarySignatoryOrganization || record.secondary_signatory_organization || null,
    secondary_signatory_signature_url: settings.secondarySignatorySignatureUrl || record.secondary_signatory_signature_url || null,
    creator_device_id: settings.creatorDeviceId || record.creator_device_id || null,
    response_count: record.survey_responses?.[0]?.count ?? record.response_count ?? 0,
  } as Survey;
}

export const surveyService = {
  async getAllSurveys(): Promise<Survey[]> {
    if (isSupabaseConfigured) {
      try {
        const supabase = createClient();
        const { data: surveys, error } = await supabase
          .from("surveys")
          .select("*, survey_responses(count)")
          .order("created_at", { ascending: false });

        if (!error && surveys) {
          const hydrated = surveys.map(hydrateSurveyRecord);
          inMemorySurveys = hydrated;
          return hydrated;
        }
      } catch (e) {
        console.warn("Supabase query failed, falling back to local storage:", e);
      }
    }
    return inMemorySurveys;
  },

  /**
   * Returns only surveys created by or owned by the current device session.
   * Survives device restarts and browser reboots.
   */
  async getMySurveys(): Promise<Survey[]> {
    const all = await this.getAllSurveys();
    if (typeof window === "undefined") return all;

    return all.filter((s) => {
      const creator = s.schema?.settings?.creatorDeviceId || s.creator_device_id;
      return deviceSessionService.isOwner(s.id, creator);
    });
  },

  async getSurveyById(idOrSlug: string): Promise<Survey | null> {
    if (isSupabaseConfigured) {
      try {
        const supabase = createClient();
        const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(idOrSlug);
        const query = supabase.from("surveys").select("*");
        const { data, error } = isUuid
          ? await query.eq("id", idOrSlug).single()
          : await query.eq("slug", idOrSlug).single();

        if (!error && data) {
          const hydrated = hydrateSurveyRecord(data);
          const idx = inMemorySurveys.findIndex((s) => s.id === hydrated.id);
          if (idx !== -1) inMemorySurveys[idx] = hydrated;
          else inMemorySurveys.push(hydrated);
          return hydrated;
        }
      } catch (e) {
        console.warn("Supabase getSurveyById failed, falling back to local:", e);
      }
    }
    return inMemorySurveys.find((s) => s.id === idOrSlug || s.slug === idOrSlug) || null;
  },

  async createSurvey(data: {
    title: string;
    description?: string;
    instructions?: string;
    schema: SurveySchema;
    slug?: string;
    signatory_name?: string | null;
    signatory_title?: string | null;
    signatory_organization?: string | null;
    signatory_signature_url?: string | null;
  }): Promise<Survey> {
    const slug = data.slug || generateSlug(data.title);
    const currentDeviceId = typeof window !== "undefined" ? deviceSessionService.getDeviceId() : null;

    // Attach current device token to schema settings for permanent session isolation
    const schemaWithDevice: SurveySchema = {
      ...data.schema,
      settings: {
        ...(data.schema.settings || {
          requireAll: true,
          allowAnonymous: true,
          showProgressBar: true,
        }),
        creatorDeviceId: data.schema.settings?.creatorDeviceId || currentDeviceId || undefined,
      },
    };

    const newSurvey: Survey = {
      id: crypto.randomUUID ? crypto.randomUUID() : `srv_${Date.now()}`,
      slug,
      title: data.title,
      description: data.description || null,
      instructions: data.instructions || null,
      schema: schemaWithDevice,
      status: "published",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      response_count: 0,
      creator_device_id: currentDeviceId,
      signatory_name: data.signatory_name || data.schema.settings?.signatoryName || null,
      signatory_title: data.signatory_title || data.schema.settings?.signatoryTitle || null,
      signatory_organization: data.signatory_organization || data.schema.settings?.signatoryOrganization || null,
      signatory_signature_url: data.signatory_signature_url || data.schema.settings?.signatorySignatureUrl || null,
    };

    if (isSupabaseConfigured) {
      try {
        const supabase = createClient();
        const { data: inserted, error } = await supabase
          .from("surveys")
          .insert({
            slug: newSurvey.slug,
            title: newSurvey.title,
            description: newSurvey.description,
            instructions: newSurvey.instructions,
            schema: newSurvey.schema,
            status: newSurvey.status,
            signatory_name: newSurvey.signatory_name,
            signatory_title: newSurvey.signatory_title,
            signatory_organization: newSurvey.signatory_organization,
            signatory_signature_url: newSurvey.signatory_signature_url,
          })
          .select()
          .single();

        if (!error && inserted) {
          const hydrated = hydrateSurveyRecord(inserted);
          if (hydrated.id && typeof window !== "undefined") {
            deviceSessionService.claimSurveyOwnership(hydrated.id);
          }
          inMemorySurveys.unshift(hydrated);
          return hydrated;
        }
      } catch (e) {
        console.warn("Supabase insert survey failed:", e);
      }
    }

    if (newSurvey.id && typeof window !== "undefined") {
      deviceSessionService.claimSurveyOwnership(newSurvey.id);
    }
    inMemorySurveys.unshift(newSurvey);
    return newSurvey;
  },

  async updateSurvey(id: string, updates: Partial<Survey>): Promise<Survey | null> {
    // 1. Locate current existing survey
    const existing = inMemorySurveys.find((s) => s.id === id) || (await this.getSurveyById(id));

    // 2. Prepare merged schema.settings
    const currentSchema: SurveySchema = updates.schema || existing?.schema || {
      sections: [],
      questions: [],
      settings: {
        requireAll: true,
        allowAnonymous: true,
        showProgressBar: true,
      },
    };

    const mergedSettings: SurveySettings = {
      ...(currentSchema.settings || {}),
      signatories: updates.signatories !== undefined ? (updates.signatories || undefined) : currentSchema.settings?.signatories,
      signatoryName: updates.signatory_name !== undefined ? (updates.signatory_name || undefined) : currentSchema.settings?.signatoryName,
      signatoryTitle: updates.signatory_title !== undefined ? (updates.signatory_title || undefined) : currentSchema.settings?.signatoryTitle,
      signatoryOrganization: updates.signatory_organization !== undefined ? (updates.signatory_organization || undefined) : currentSchema.settings?.signatoryOrganization,
      signatorySignatureUrl: updates.signatory_signature_url !== undefined ? (updates.signatory_signature_url || undefined) : currentSchema.settings?.signatorySignatureUrl,
      secondarySignatoryName: updates.secondary_signatory_name !== undefined ? (updates.secondary_signatory_name || undefined) : currentSchema.settings?.secondarySignatoryName,
      secondarySignatoryTitle: updates.secondary_signatory_title !== undefined ? (updates.secondary_signatory_title || undefined) : currentSchema.settings?.secondarySignatoryTitle,
      secondarySignatoryOrganization: updates.secondary_signatory_organization !== undefined ? (updates.secondary_signatory_organization || undefined) : currentSchema.settings?.secondarySignatoryOrganization,
      secondarySignatorySignatureUrl: updates.secondary_signatory_signature_url !== undefined ? (updates.secondary_signatory_signature_url || undefined) : currentSchema.settings?.secondarySignatorySignatureUrl,
      capstoneLogoUrl: updates.capstone_logo_url !== undefined ? (updates.capstone_logo_url || undefined) : currentSchema.settings?.capstoneLogoUrl,
      certificateThemeColor: updates.certificate_theme_color !== undefined ? (updates.certificate_theme_color || undefined) : currentSchema.settings?.certificateThemeColor,
      creatorDeviceId: updates.creator_device_id !== undefined ? (updates.creator_device_id || undefined) : currentSchema.settings?.creatorDeviceId,
    };

    const finalSchema: SurveySchema = {
      ...currentSchema,
      settings: mergedSettings,
    };

    // 3. Strict dbPayload: only columns that exist in public.surveys table
    const dbPayload: Record<string, any> = {
      schema: finalSchema,
      updated_at: new Date().toISOString(),
    };

    if (updates.slug !== undefined) dbPayload.slug = updates.slug;
    if (updates.title !== undefined) dbPayload.title = updates.title;
    if (updates.description !== undefined) dbPayload.description = updates.description;
    if (updates.instructions !== undefined) dbPayload.instructions = updates.instructions;
    if (updates.status !== undefined) dbPayload.status = updates.status;
    if (updates.signatory_name !== undefined) dbPayload.signatory_name = updates.signatory_name;
    if (updates.signatory_title !== undefined) dbPayload.signatory_title = updates.signatory_title;
    if (updates.signatory_organization !== undefined) dbPayload.signatory_organization = updates.signatory_organization;
    if (updates.signatory_signature_url !== undefined) dbPayload.signatory_signature_url = updates.signatory_signature_url;

    // 4. Update in Supabase
    let savedSurvey: Survey | null = null;
    if (isSupabaseConfigured) {
      try {
        const supabase = createClient();
        const { data, error } = await supabase
          .from("surveys")
          .update(dbPayload)
          .eq("id", id)
          .select()
          .single();

        if (error) {
          console.error("[Supabase updateSurvey Error]:", error);
          throw new Error(`Database error saving survey: ${error.message} (${error.code})`);
        }

        if (data) {
          savedSurvey = hydrateSurveyRecord(data);
        }
      } catch (e: any) {
        console.error("Supabase update survey failed:", e);
        throw e;
      }
    }

    const finalResult: Survey = savedSurvey || hydrateSurveyRecord({
      ...(existing || {}),
      ...updates,
      schema: finalSchema,
    });

    const index = inMemorySurveys.findIndex((s) => s.id === id);
    if (index !== -1) {
      inMemorySurveys[index] = finalResult;
    } else {
      inMemorySurveys.unshift(finalResult);
    }

    return finalResult;
  },

  async deleteSurvey(id: string): Promise<boolean> {
    if (typeof window !== "undefined") {
      deviceSessionService.removeSurveyOwnership(id);
    }
    if (isSupabaseConfigured) {
      try {
        const supabase = createClient();
        await supabase.from("surveys").delete().eq("id", id);
      } catch (e) {
        console.warn("Supabase delete failed:", e);
      }
    }
    inMemorySurveys = inMemorySurveys.filter((s) => s.id !== id);
    inMemoryResponses = inMemoryResponses.filter((r) => r.survey_id !== id);
    return true;
  },

  // ------------------- Responses & Editing -------------------

  async getSurveyResponses(surveyId: string): Promise<SurveyResponse[]> {
    if (isSupabaseConfigured) {
      try {
        const supabase = createClient();
        const { data, error } = await supabase
          .from("survey_responses")
          .select("*")
          .eq("survey_id", surveyId)
          .order("created_at", { ascending: false });

        if (!error && data) {
          return data as SurveyResponse[];
        }
      } catch (e) {
        console.warn("Supabase getSurveyResponses failed:", e);
      }
    }
    return inMemoryResponses.filter((r) => r.survey_id === surveyId);
  },

  async submitResponse(
    surveyId: string,
    payload: {
      respondent_name?: string | null;
      respondent_role?: string | null;
      answers: Record<string, any>;
    }
  ): Promise<SurveyResponse> {
    const newResponse: SurveyResponse = {
      id: crypto.randomUUID ? crypto.randomUUID() : `resp_${Date.now()}`,
      survey_id: surveyId,
      respondent_name: payload.respondent_name || null,
      respondent_role: payload.respondent_role || null,
      answers: payload.answers,
      completion_status: "completed",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    if (isSupabaseConfigured) {
      try {
        const supabase = createClient();
        const { data, error } = await supabase
          .from("survey_responses")
          .insert({
            survey_id: surveyId,
            respondent_name: newResponse.respondent_name,
            respondent_role: newResponse.respondent_role,
            answers: newResponse.answers,
            completion_status: "completed",
          })
          .select()
          .single();

        if (!error && data) {
          inMemoryResponses.unshift(data as SurveyResponse);
          return data as SurveyResponse;
        }
      } catch (e) {
        console.warn("Supabase submitResponse failed:", e);
      }
    }

    inMemoryResponses.unshift(newResponse);
    return newResponse;
  },

  /**
   * Fetch a specific survey response by ID
   */
  async getSurveyResponseById(responseId: string): Promise<SurveyResponse | null> {
    if (isSupabaseConfigured) {
      try {
        const supabase = createClient();
        const { data, error } = await supabase
          .from("survey_responses")
          .select("*")
          .eq("id", responseId)
          .single();

        if (!error && data) {
          return data as SurveyResponse;
        }
      } catch (e) {
        console.warn("Supabase getSurveyResponseById failed:", e);
      }
    }

    const mem = inMemoryResponses.find((r) => r.id === responseId);
    return mem || null;
  },

  /**
   * Update an existing survey response (Edit actual survey answers)
   */
  async updateSurveyResponse(
    responseId: string,
    updates: {
      respondent_name?: string | null;
      respondent_role?: string | null;
      answers?: Record<string, any>;
      completion_status?: "in_progress" | "completed";
    }
  ): Promise<SurveyResponse> {
    let saved: SurveyResponse | null = null;
    if (isSupabaseConfigured) {
      try {
        const supabase = createClient();
        const { data, error } = await supabase
          .from("survey_responses")
          .update({
            ...updates,
            updated_at: new Date().toISOString(),
          })
          .eq("id", responseId)
          .select()
          .single();

        if (!error && data) {
          saved = data as SurveyResponse;
        }
      } catch (e) {
        console.warn("Supabase updateSurveyResponse failed:", e);
      }
    }

    const idx = inMemoryResponses.findIndex((r) => r.id === responseId);
    if (idx !== -1) {
      inMemoryResponses[idx] = {
        ...inMemoryResponses[idx],
        ...updates,
        updated_at: new Date().toISOString(),
      };
      return inMemoryResponses[idx];
    } else if (saved) {
      inMemoryResponses.push(saved);
      return saved;
    } else {
      const fallback: SurveyResponse = {
        id: responseId,
        survey_id: "",
        respondent_name: updates.respondent_name || null,
        respondent_role: updates.respondent_role || null,
        answers: updates.answers || {},
        completion_status: updates.completion_status || "completed",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      inMemoryResponses.push(fallback);
      return fallback;
    }
  },

  async deleteSurveyResponse(responseId: string): Promise<boolean> {
    if (isSupabaseConfigured) {
      try {
        const supabase = createClient();
        await supabase.from("survey_responses").delete().eq("id", responseId);
      } catch (e) {
        console.warn("Supabase delete response failed:", e);
      }
    }
    inMemoryResponses = inMemoryResponses.filter((r) => r.id !== responseId);
    return true;
  },
};

