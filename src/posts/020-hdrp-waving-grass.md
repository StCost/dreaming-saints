# Unity HDRP waving grass

https://www.youtube.com/watch?v=N-zCMAecTI0

<img width="1995" height="789" alt="image" src="https://github.com/user-attachments/assets/261fface-67f2-4fb7-bdb6-1da2cabe6681" />

```
Shader "uTerrains/HDRP/Waving Grass"
{
    Properties
    {
        [Header(Base)]
        _BaseMap ("Texture", 2D) = "white" {}
        _BaseColor ("Color", Color) = (1, 1, 1, 1)
        [Header(Wind)]
        _WaveSize ("Wave Size", Range(0.01, 0.5)) = 0.1
        [Header(Distance Fade)]
        _FadeStart ("Fade Start Distance", Float) = 50
        _FadeEnd ("Fade End Distance", Float) = 70
        [Header(Alpha)]
        _Cutoff ("Alpha Cutoff", Range(0, 1)) = 0.5
    }
    SubShader
    {
        Tags
        {
            "RenderPipeline" = "HDRenderPipeline"
            "RenderType" = "TransparentCutout"
            "Queue" = "AlphaTest"
        }
        Pass
        {
            Name "Forward"
            Tags { "LightMode" = "ForwardOnly" }

            Cull Off
            ZWrite On
            ZTest LEqual

            HLSLPROGRAM
            #pragma vertex Vert
            #pragma fragment Frag

            #pragma multi_compile_instancing

            #include "Packages/com.unity.render-pipelines.core/ShaderLibrary/Common.hlsl"
            #include "Packages/com.unity.render-pipelines.high-definition/Runtime/ShaderLibrary/ShaderVariables.hlsl"
            #include "WavingGrassVertex.hlsl"

            TEXTURE2D(_BaseMap);
            SAMPLER(sampler_BaseMap);
            float4 _BaseMap_ST;
            float4 _BaseColor;
            float _WaveSize;
            float _FadeStart;
            float _FadeEnd;
            float _Cutoff;

            float _GlobalWindSpeed;
            float _GlobalWindStrength;

            struct Attributes
            {
                float4 positionOS : POSITION;
                float3 normalOS : NORMAL;
                float2 uv : TEXCOORD0;
                float4 color : COLOR;
                UNITY_VERTEX_INPUT_INSTANCE_ID
            };

            struct Varyings
            {
                float4 positionCS : SV_POSITION;
                float2 uv : TEXCOORD0;
                float3 positionWS : TEXCOORD1;
                float3 normalWS : TEXCOORD2;
                float4 color : COLOR;
                UNITY_VERTEX_OUTPUT_STEREO
            };

            float3 EvalSH(float3 N)
            {
                float4 vA = float4(N, 1.0);
                float3 res;
                res.r = dot(unity_SHAr, vA);
                res.g = dot(unity_SHAg, vA);
                res.b = dot(unity_SHAb, vA);
                float4 vB = N.xyzz * N.yzzx;
                res.r += dot(unity_SHBr, vB);
                res.g += dot(unity_SHBg, vB);
                res.b += dot(unity_SHBb, vB);
                float vC = N.x * N.x - N.y * N.y;
                res += unity_SHC.rgb * vC;
                return max(0.0, res);
            }

            Varyings Vert(Attributes input)
            {
                Varyings output;
                UNITY_SETUP_INSTANCE_ID(input);
                UNITY_INITIALIZE_VERTEX_OUTPUT_STEREO(output);

                float4 posOS = input.positionOS;
                float waveAmount = input.color.a;
                ApplyWavingGrass(posOS, waveAmount, _GlobalWindSpeed, _WaveSize, _GlobalWindStrength);

                float3 positionWS = TransformObjectToWorld(posOS.xyz);
                output.positionCS = TransformWorldToHClip(positionWS);
                output.positionWS = positionWS;
                output.normalWS = TransformObjectToWorldNormal(input.normalOS);
                output.uv = input.uv * _BaseMap_ST.xy + _BaseMap_ST.zw;
                output.color = input.color;
                return output;
            }

            float DitherPattern(float2 screenPos)
            {
                const float dither[16] = {
                     0.0/16.0,  8.0/16.0,  2.0/16.0, 10.0/16.0,
                    12.0/16.0,  4.0/16.0, 14.0/16.0,  6.0/16.0,
                     3.0/16.0, 11.0/16.0,  1.0/16.0,  9.0/16.0,
                    15.0/16.0,  7.0/16.0, 13.0/16.0,  5.0/16.0
                };
                uint2 px = uint2(screenPos) % 4;
                return dither[px.y * 4 + px.x];
            }

            float4 Frag(Varyings input) : SV_Target0
            {
                UNITY_SETUP_STEREO_EYE_INDEX_POST_VERTEX(input);

                float4 baseMap = SAMPLE_TEXTURE2D(_BaseMap, sampler_BaseMap, input.uv);
                float4 col = baseMap * _BaseColor * input.color;
                clip(col.a - _Cutoff);

                // Distance fade (dithered)
                float dist = distance(input.positionWS, GetCurrentViewPosition());
                float fade = 1.0 - saturate((dist - _FadeStart) / max(_FadeEnd - _FadeStart, 0.001));
                clip(fade - DitherPattern(input.positionCS.xy));

                float3 N = normalize(input.normalWS);

                // Ambient from spherical harmonics (light probes / sky)
                float3 lighting = EvalSH(N);

                // Direct light from all HDRP directional lights
                for (uint i = 0; i < _DirectionalLightCount; i++)
                {
                    DirectionalLightData light = _DirectionalLightDatas[i];
                    float3 L = -light.forward;
                    float NdotL = saturate(dot(N, L));
                    lighting += light.color * NdotL * light.diffuseDimmer;
                }

                // Punctual lights (point + spot)
                for (uint j = 0; j < _PunctualLightCount; j++)
                {
                    LightData light = _LightDatas[j];
                    float3 toLight = light.positionRWS - input.positionWS;
                    float distSq = dot(toLight, toLight);
                    float3 L = normalize(toLight);
                    float NdotL = saturate(dot(N, L));

                    // Smooth distance windowing
                    float rangeSq = light.range * light.range;
                    float distRatio = distSq / rangeSq;
                    float distAtten = saturate(1.0 - distRatio * distRatio);
                    distAtten *= distAtten;

                    // Spot cone (angleScale=0, angleOffset=1 for point lights — evaluates to 1)
                    float cosAngle = dot(light.forward, -L);
                    float spotAtten = saturate(cosAngle * light.angleScale + light.angleOffset);
                    spotAtten *= spotAtten;

                    lighting += light.color * NdotL * distAtten * spotAtten * light.diffuseDimmer;
                }

                // Area lights (rectangle, disc, tube) — stored after punctual in the same buffer
                for (uint k = 0; k < _AreaLightCount; k++)
                {
                    LightData light = _LightDatas[_PunctualLightCount + k];
                    float3 toCenter = light.positionRWS - input.positionWS;

                    // Closest point on the area light surface
                    float halfW = light.size.x * 0.5;
                    float halfH = light.size.y * 0.5;
                    float pR = clamp(dot(toCenter, light.right), -halfW, halfW);
                    float pU = clamp(dot(toCenter, light.up),    -halfH, halfH);
                    float3 closest = light.positionRWS - pR * light.right - pU * light.up;
                    float3 toClosest = closest - input.positionWS;
                    float closestDistSq = dot(toClosest, toClosest);

                    float3 L = normalize(toClosest);
                    float NdotL = saturate(dot(N, L));

                    // Steeper distance falloff for area lights
                    float rangeSq = light.range * light.range;
                    float distRatio = closestDistSq / rangeSq;
                    float distAtten = saturate(1.0 - distRatio);
                    distAtten = distAtten * distAtten;

                    // Only emit from front face
                    float facing = saturate(dot(light.forward, -L));

                    lighting += light.color * (NdotL * distAtten * facing * light.diffuseDimmer * INV_PI * 0.5);
                }

                // HDRP uses physical light units — apply exposure to match the scene
                lighting *= GetCurrentExposureMultiplier();

                col.rgb *= lighting;
                col.a = 1.0;
                return col;
            }
            ENDHLSL
        }
    }
    Fallback Off
}

```

```
// Waving grass vertex displacement for HDRP
// Wind speed and strength drive wave animation (set per material or via WindGrassDriver.cs)

#ifndef WAVING_GRASS_VERTEX_HLSL
#define WAVING_GRASS_VERTEX_HLSL

void FastSinCos_Grass(float4 val, out float4 s, out float4 c)
{
    val = val * 6.408849 - 3.1415927;
    float4 r5 = val * val;
    float4 r6 = r5 * r5;
    float4 r7 = r6 * r5;
    float4 r8 = r6 * r5;
    float4 r1 = r5 * val;
    float4 r2 = r1 * r5;
    float4 r3 = r2 * r5;
    float4 sin7 = float4(1, -0.16161616, 0.0083333, -0.00019841);
    float4 cos8 = float4(-0.5, 0.041666666, -0.0013888889, 0.000024801587);
    s = val + r1 * sin7.y + r2 * sin7.z + r3 * sin7.w;
    c = 1 + r5 * cos8.x + r6 * cos8.y + r7 * cos8.z + r8 * cos8.w;
}

// vertex: object-space position (xyzw). waveAmount: 0..1 per vertex (e.g. vertex color alpha). windSpeed, waveSize, windStrength: material params.
void ApplyWavingGrass(inout float4 vertex, float waveAmount, float windSpeed, float waveSize, float windStrength)
{
    float4 waveXSize = float4(0.012, 0.02, 0.06, 0.024) * waveSize;
    float4 waveZSize = float4(0.006, 0.02, 0.02, 0.05) * waveSize;
    float4 waveSpeed = float4(0.3, 0.5, 0.4, 1.2) * 4.0;

    float4 waveXmove = float4(0.012, 0.02, -0.06, 0.048) * 2.0;
    float4 waveZmove = float4(0.006, 0.02, -0.02, 0.1);

    float4 waves = vertex.x * waveXSize + vertex.z * waveZSize;
    waves += (windSpeed * _Time.y) * waveSpeed;

    float4 s, c;
    waves = frac(waves);
    FastSinCos_Grass(waves, s, c);

    s = s * s;
    s = s * s;
    s = s * waveAmount * windStrength;

    float3 waveMove = float3(dot(s, waveXmove), 0, dot(s, waveZmove));
    vertex.xz -= waveMove.xz;
}

#endif
```

```
using UnityEngine;

namespace uTerrains
{
    /// <summary>
    /// Drives HDRP Waving Grass shader wind parameters from a Wind Zone or manual values.
    /// Add to a GameObject; assign a Wind Zone to use its strength, or leave empty and set Wind Speed manually.
    /// Materials using "uTerrains/HDRP/Waving Grass" will receive _WindSpeed (and optionally _WindStrength) each frame.
    /// </summary>
    public class WindGrassDriver : MonoBehaviour
    {
        [Tooltip("Optional. If set, Wind Speed and Wind Strength are derived from this Wind Zone.")]
        public WindZone windZone;

        [Tooltip("Wind speed multiplier (animation speed). Used when Wind Zone is not set, or multiplied with Wind Zone main.")]
        [Range(0f, 5f)]
        public float windSpeed = 2.5f;

        [Tooltip("Wind strength (bend amount). Used when Wind Zone is not set, or multiplied with Wind Zone turbulence.")]
        [Range(0f, 2f)]
        public float windStrength = 0.2f;

        private static readonly int WindSpeedId = Shader.PropertyToID("_WindSpeed");
        private static readonly int WindStrengthId = Shader.PropertyToID("_WindStrength");
        private static readonly int GlobalWindSpeedId = Shader.PropertyToID("_GlobalWindSpeed");
        private static readonly int GlobalWindStrengthId = Shader.PropertyToID("_GlobalWindStrength");

        private void Update()
        {
            float speed = windSpeed;
            float strength = windStrength;

            if (windZone is not null)
            {
                speed *= Mathf.Max(0.01f, windZone.windMain);
                strength *= Mathf.Max(0.01f, windZone.windTurbulence);
            }

            Shader.SetGlobalFloat(GlobalWindSpeedId, speed);
            Shader.SetGlobalFloat(GlobalWindStrengthId, strength);
        }
    }
}
```
