<template>
	<q-banner
		v-if="$q.platform.is.mobile"
		class="bg-info text-white q-mt-md q-mb-md"
	>
		<template v-slot:avatar>
			<q-icon name="desktop_access_disabled" />
		</template>
		<div class="row full-width justify-center">
			<span class="text-body1">{{ $capitalize($t('create.mobile')) }}</span>
		</div>
	</q-banner>

	<div
		v-show="!isLoad"
		class="full-width row justify-center q-pt-xl"
	>
		<q-spinner-cube size="8em" color="deep-purple-7" />
	</div>
	<div
		v-show="isLoad"
		ref="editor"
		class="builderEditor border"
	>
	</div>
</template>

<script lang="ts">
import { defineComponent, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { inlineContent } from 'juice';
import { useQuasar } from 'quasar';
import { api } from 'src/boot/axios';
import initGrapeJs from 'src/builder';
import 'grapesjs/dist/css/grapes.min.css';
import type { Editor } from 'grapesjs';

export default defineComponent({
	name: 'ComponentsBuilderMain',
	props: {
		seriesId: {
			type: Number,
			required: true
		},
		id: {
			type: Number,
			required: true
		}
	},
	setup (props) {
		const { t, locale } = useI18n({ useScope: 'global' });
		const $q = useQuasar();
		const autoSave = ref<NodeJS.Timeout | undefined>(undefined); // eslint-disable-line no-undef
		const grapesjsInstance = ref<Editor | null>(null);
		const editor = ref<HTMLElement | null>(null);
		const isLoad = ref<boolean>(false);

		const generateAndSaveHTML = async (autosave = false) => {
			if (!grapesjsInstance.value)
				return;

			const generateData: { html: string, css: string[] } = {
				html: '',
				css: []
			};

			const cssTag = document.createElement('style');
			cssTag.textContent = grapesjsInstance.value.getCss() ?? null;
			if (cssTag.textContent) {
				const fakeDocCss = document.implementation.createHTMLDocument();
				fakeDocCss.body.appendChild(cssTag);
				if (cssTag.sheet && cssTag.sheet.cssRules) {
					for (let i = 0; i < cssTag.sheet.cssRules.length; i++) {
						if (!['*', 'body'].includes((cssTag.sheet.cssRules[i] as CSSStyleRule).selectorText))
							generateData.css.push(cssTag.sheet.cssRules[i].cssText);
					}
				}
			}

			const genHtml = grapesjsInstance.value.getHtml({ cleanId: true });
			if (genHtml) {
				const domParser = new DOMParser().parseFromString(genHtml, 'text/html');
				const htmlTag = document.createElement('div');
				htmlTag.innerHTML = domParser.body.innerHTML;
				if (domParser.body.classList.length)
					htmlTag.classList.add(...domParser.body.classList.value);
				if (domParser.body.id)
					htmlTag.id = domParser.body.id;
				generateData.html = htmlTag.outerHTML;
			}

			const data = inlineContent(generateData.html, generateData.css.join(' '));
			if (!data)
				return;

			api.put('/enigmas/page/prod', {
				enigma_id: props.id,
				series_id: props.seriesId,
				editor_data: data
			})
				.then(() => $q.notify({
					type: 'info',
					message: t(`builder.${autosave === true
						? 'autosave'
						: 'save'}`)
				}))
				.catch((e) => {
					$q.notify({ type: 'failed', message: e.response.data.info.message });
				});
		};

		onMounted(() => {
			grapesjsInstance.value = initGrapeJs(editor.value as HTMLElement, props.id, props.seriesId);
			grapesjsInstance.value.I18n.setLocale(locale.value);

			grapesjsInstance.value.once('storage:end:load', () => {
				// 5 minutes
				autoSave.value = setInterval(() => generateAndSaveHTML(true), 1000 * 60 * 5);
				isLoad.value = true;
			});

			watch(locale, (newLang) => {
				grapesjsInstance.value?.I18n.setLocale(newLang);
			});
		});

		onBeforeUnmount(() => {
			grapesjsInstance.value?.store();
			if (autoSave.value)
				clearInterval(autoSave.value);
			generateAndSaveHTML();
		});

		return {
			editor,
			isLoad
		};
	}
});
</script>

<style lang="scss" scoped>
.border {
	border: 2px solid $blue-grey-7
}
</style>
