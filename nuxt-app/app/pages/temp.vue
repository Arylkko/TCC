                 <template>
<!--
                 <div class="comment-header">
                    <div class="comment-author">
                      <div class="i-mdi:account-circle author-icon"></div>
                      <span class="author-name">
                        {{
                          comentario.expand?.autor?.name ||
                          comentario.expand?.autor?.email ||
                          "Usuário"
                        }}
                      </span>
                    </div>
                    <span class="comment-date">{{
                      formatarData(comentario.created)
                    }}</span>
                  </div>

                  <p class="comment-text">{{ comentario.conteudo }}</p>


                  <button
                    v-if="isAuthenticated"
                    @click="iniciarResposta(comentario.id)"
                    class="comment-reply-button"
                  >
                    <div class="i-mdi:reply"></div>
                    Responder
                  </button>


                  <div v-if="comentarioRespondendo === comentario.id" class="reply-form">
                    <textarea
                      v-model="respostaTexto"
                      placeholder="Escreva sua resposta..."
                      class="reply-textarea"
                      rows="2"
                    ></textarea>
                    <div class="reply-actions">
                      <button
                        @click="enviarResposta(comentario.id)"
                        :disabled="!respostaTexto.trim()"
                        class="btn-small btn-primary"
                      >
                        Enviar
                      </button>
                      <button @click="cancelarResposta" class="btn-small btn-secondary">
                        Cancelar
                      </button>
                    </div>
                  </div>

             
                  <div
                    v-if="comentario.respostas && comentario.respostas.length > 0"
                    class="replies-list"
                  >
                    <div
                      v-for="resposta in comentario.respostas"
                      :key="resposta.id"
                      class="reply-item"
                    >
                      <div class="comment-header">
                        <div class="comment-author">
                          <div class="i-mdi:account-circle author-icon"></div>
                          <span class="author-name">
                            {{
                              resposta.expand?.autor?.name ||
                              resposta.expand?.autor?.email ||
                              "Usuário"
                            }}
                          </span>
                        </div>
                        <span class="comment-date">{{
                          formatarData(resposta.created)
                        }}</span>
                      </div>
                      <p class="comment-text">{{ resposta.conteudo }}</p>
                    </div>
                  </div>
-->
                  </template>